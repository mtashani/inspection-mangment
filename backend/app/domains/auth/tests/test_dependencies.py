"""Unit tests for authentication dependencies"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials

from app.domains.auth.dependencies import (
    get_current_inspector,
    get_current_active_inspector,
    require_permission,
    require_any_permission,
    require_all_permissions,
    log_request
)
from app.domains.inspector.models.inspector import Inspector


class TestAuthDependencies:
    """Test cases for authentication dependencies"""

    @pytest.fixture
    def mock_request(self):
        """Mock FastAPI request"""
        request = MagicMock(spec=Request)
        request.client.host = "127.0.0.1"
        request.url.path = "/api/v1/test"
        request.method = "GET"
        request.headers = {"user-agent": "test-client"}
        return request

    @pytest.fixture
    def mock_credentials(self):
        """Mock HTTP authorization credentials"""
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token")

    @pytest.fixture
    def mock_inspector(self):
        """Mock active inspector"""
        inspector = MagicMock(spec=Inspector)
        inspector.id = 1
        inspector.username = "test_inspector"
        inspector.active = True
        inspector.can_login = True
        return inspector

    @pytest.fixture
    def mock_inactive_inspector(self):
        """Mock inactive inspector"""
        inspector = MagicMock(spec=Inspector)
        inspector.id = 2
        inspector.username = "inactive_inspector"
        inspector.active = False
        inspector.can_login = True
        return inspector

    @pytest.fixture
    def mock_no_login_inspector(self):
        """Mock inspector without login permission"""
        inspector = MagicMock(spec=Inspector)
        inspector.id = 3
        inspector.username = "no_login_inspector"
        inspector.active = True
        inspector.can_login = False
        return inspector

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return MagicMock()

    @pytest.mark.asyncio
    async def test_get_current_inspector_success(self, mock_request, mock_credentials, mock_db, mock_inspector):
        """Test successful inspector retrieval"""
        with patch('app.domains.auth.dependencies.AuthService.get_current_inspector') as mock_auth:
            mock_auth.return_value = mock_inspector
            
            result = await get_current_inspector(mock_request, mock_credentials, mock_db)
            
            assert result == mock_inspector
            mock_auth.assert_called_once_with(mock_db, "test-token")

    @pytest.mark.asyncio
    async def test_get_current_inspector_no_credentials(self, mock_request, mock_db):
        """Test inspector retrieval without credentials"""
        result = await get_current_inspector(mock_request, None, mock_db)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_current_inspector_invalid_token(self, mock_request, mock_credentials, mock_db):
        """Test inspector retrieval with invalid token"""
        with patch('app.domains.auth.dependencies.AuthService.get_current_inspector') as mock_auth:
            mock_auth.return_value = None
            
            result = await get_current_inspector(mock_request, mock_credentials, mock_db)
            assert result is None

    @pytest.mark.asyncio
    async def test_get_current_active_inspector_success(self, mock_inspector):
        """Test successful active inspector retrieval"""
        result = await get_current_active_inspector(mock_inspector)
        assert result == mock_inspector

    @pytest.mark.asyncio
    async def test_get_current_active_inspector_no_inspector(self):
        """Test active inspector retrieval with no inspector"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_active_inspector(None)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_active_inspector_inactive(self, mock_inactive_inspector):
        """Test active inspector retrieval with inactive inspector"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_active_inspector(mock_inactive_inspector)
        
        assert exc_info.value.status_code == 401
        assert "inactive" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_active_inspector_no_login(self, mock_no_login_inspector):
        """Test active inspector retrieval with inspector who cannot login"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_active_inspector(mock_no_login_inspector)
        
        assert exc_info.value.status_code == 401
        assert "cannot login" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_require_permission_success(self, mock_request, mock_inspector, mock_db):
        """Test successful permission check"""
        permission_dep = require_permission("ndt", "create")
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.return_value = True
            
            result = await permission_dep(mock_request, mock_inspector, mock_db)
            
            assert result == mock_inspector
            mock_has_perm.assert_called_once_with(mock_db, mock_inspector, "ndt", "create")

    @pytest.mark.asyncio
    async def test_require_permission_denied(self, mock_request, mock_inspector, mock_db):
        """Test permission denied"""
        permission_dep = require_permission("ndt", "create")
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await permission_dep(mock_request, mock_inspector, mock_db)
            
            assert exc_info.value.status_code == 403
            assert "ndt:create" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_require_permission_error(self, mock_request, mock_inspector, mock_db):
        """Test permission check error"""
        permission_dep = require_permission("ndt", "create")
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.side_effect = Exception("Database error")
            
            with pytest.raises(HTTPException) as exc_info:
                await permission_dep(mock_request, mock_inspector, mock_db)
            
            assert exc_info.value.status_code == 500
            assert "Permission check failed" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_require_any_permission_success(self, mock_request, mock_inspector, mock_db):
        """Test successful any permission check"""
        any_permission_dep = require_any_permission(("ndt", "create"), ("psv", "create"))
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            # First permission fails, second succeeds
            mock_has_perm.side_effect = [False, True]
            
            result = await any_permission_dep(mock_request, mock_inspector, mock_db)
            
            assert result == mock_inspector
            assert mock_has_perm.call_count == 2

    @pytest.mark.asyncio
    async def test_require_any_permission_denied(self, mock_request, mock_inspector, mock_db):
        """Test any permission denied"""
        any_permission_dep = require_any_permission(("ndt", "create"), ("psv", "create"))
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await any_permission_dep(mock_request, mock_inspector, mock_db)
            
            assert exc_info.value.status_code == 403
            assert "ndt:create" in exc_info.value.detail
            assert "psv:create" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_require_all_permissions_success(self, mock_request, mock_inspector, mock_db):
        """Test successful all permissions check"""
        all_permissions_dep = require_all_permissions(("ndt", "create"), ("psv", "view"))
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.return_value = True
            
            result = await all_permissions_dep(mock_request, mock_inspector, mock_db)
            
            assert result == mock_inspector
            assert mock_has_perm.call_count == 2

    @pytest.mark.asyncio
    async def test_require_all_permissions_partial_denied(self, mock_request, mock_inspector, mock_db):
        """Test all permissions with some denied"""
        all_permissions_dep = require_all_permissions(("ndt", "create"), ("psv", "delete"))
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            # First permission succeeds, second fails
            mock_has_perm.side_effect = [True, False]
            
            with pytest.raises(HTTPException) as exc_info:
                await all_permissions_dep(mock_request, mock_inspector, mock_db)
            
            assert exc_info.value.status_code == 403
            assert "psv:delete" in exc_info.value.detail
            assert "ndt:create" not in exc_info.value.detail  # Should only show missing permissions

    @pytest.mark.asyncio
    async def test_require_all_permissions_all_denied(self, mock_request, mock_inspector, mock_db):
        """Test all permissions denied"""
        all_permissions_dep = require_all_permissions(("ndt", "create"), ("psv", "delete"))
        
        with patch('app.domains.auth.dependencies.PermissionService.has_permission') as mock_has_perm:
            mock_has_perm.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await all_permissions_dep(mock_request, mock_inspector, mock_db)
            
            assert exc_info.value.status_code == 403
            assert "ndt:create" in exc_info.value.detail
            assert "psv:delete" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_log_request_with_inspector(self, mock_request, mock_inspector):
        """Test request logging with authenticated inspector"""
        with patch('app.domains.auth.dependencies.logging') as mock_logging:
            result = await log_request(mock_request, mock_inspector)
            
            assert result == mock_inspector
            mock_logging.info.assert_called_once()
            
            # Check that the log message contains expected information
            log_call = mock_logging.info.call_args[0][0]
            assert "inspector=1" in log_call
            assert "test_inspector" in log_call
            assert "GET" in log_call
            assert "/api/v1/test" in log_call

    @pytest.mark.asyncio
    async def test_log_request_anonymous(self, mock_request):
        """Test request logging without authenticated inspector"""
        with patch('app.domains.auth.dependencies.logging') as mock_logging:
            result = await log_request(mock_request, None)
            
            assert result is None
            mock_logging.info.assert_called_once()
            
            # Check that the log message contains anonymous information
            log_call = mock_logging.info.call_args[0][0]
            assert "inspector=anonymous" in log_call
            assert "anonymous" in log_call

    def test_convenience_dependencies_exist(self):
        """Test that convenience dependencies are properly defined"""
        from app.domains.auth.dependencies import (
            require_admin_access,
            require_user_management,
            require_role_management,
            require_permission_management
        )
        
        # These should be callable dependency functions
        assert callable(require_admin_access)
        assert callable(require_user_management)
        assert callable(require_role_management)
        assert callable(require_permission_management)