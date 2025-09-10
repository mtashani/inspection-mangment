"""Example usage of RBI REST API"""

import asyncio
import httpx
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

# API Base URL (adjust as needed)
API_BASE_URL = "http://localhost:8000/api/v1/rbi"


class RBIAPIClient:
    """Client for RBI REST API"""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def calculate_rbi(self, equipment_data: Dict[str, Any], user_id: str = "api_user") -> Dict[str, Any]:
        """Perform RBI calculation for single equipment"""
        
        request_data = {
            "equipment_id": equipment_data["equipment_id"],
            "equipment_data": equipment_data,
            "user_id": user_id
        }
        
        response = await self.client.post(f"{self.base_url}/calculate", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def calculate_rbi_batch(self, equipment_list: List[Dict[str, Any]], user_id: str = "api_user") -> Dict[str, Any]:
        """Perform batch RBI calculations"""
        
        request_data = {
            "equipment_list": equipment_list,
            "user_id": user_id
        }
        
        response = await self.client.post(f"{self.base_url}/calculate/batch", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def get_calculation_history(self, equipment_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get calculation history for equipment"""
        
        params = {"limit": limit}
        response = await self.client.get(f"{self.base_url}/calculation/{equipment_id}/history", params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_configuration(self) -> Dict[str, Any]:
        """Get current RBI configuration"""
        
        response = await self.client.get(f"{self.base_url}/configuration")
        response.raise_for_status()
        return response.json()
    
    async def update_configuration(self, updates: Dict[str, Any], user_id: str = "admin", reason: str = "API update") -> Dict[str, Any]:
        """Update RBI configuration"""
        
        request_data = {
            "configuration_updates": updates,
            "user_id": user_id,
            "update_reason": reason
        }
        
        response = await self.client.put(f"{self.base_url}/configuration", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def validate_configuration(self, updates: Dict[str, Any], user_id: str = "admin") -> Dict[str, Any]:
        """Validate configuration changes"""
        
        request_data = {
            "configuration_updates": updates,
            "user_id": user_id
        }
        
        response = await self.client.post(f"{self.base_url}/configuration/validate", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def generate_calculation_report(self, equipment_id: str, report_format: str = "json") -> Dict[str, Any]:
        """Generate calculation report"""
        
        request_data = {
            "equipment_id": equipment_id,
            "report_format": report_format,
            "include_charts": True,
            "include_recommendations": True
        }
        
        response = await self.client.post(f"{self.base_url}/report/calculation", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def get_system_summary(self, include_statistics: bool = True, date_range_days: int = 30) -> Dict[str, Any]:
        """Get system summary report"""
        
        params = {
            "include_statistics": include_statistics,
            "date_range_days": date_range_days
        }
        
        response = await self.client.get(f"{self.base_url}/report/system-summary", params=params)
        response.raise_for_status()
        return response.json()
    
    async def analyze_equipment_patterns(self, equipment_id: str, equipment_data: Dict[str, Any], historical_calculations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze equipment patterns"""
        
        request_data = {
            "equipment_id": equipment_id,
            "equipment_data": equipment_data,
            "historical_calculations": historical_calculations
        }
        
        response = await self.client.post(f"{self.base_url}/pattern/analyze", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def get_equipment_families(self, equipment_type: str = None, service_type: str = None) -> Dict[str, Any]:
        """Get equipment families"""
        
        params = {}
        if equipment_type:
            params["equipment_type"] = equipment_type
        if service_type:
            params["service_type"] = service_type
        
        response = await self.client.get(f"{self.base_url}/pattern/families", params=params)
        response.raise_for_status()
        return response.json()
    
    async def adjust_parameters(self, equipment_id: str, current_parameters: Dict[str, float], strategy: str = "balanced", user_id: str = "api_user") -> Dict[str, Any]:
        """Adjust RBI parameters"""
        
        request_data = {
            "equipment_id": equipment_id,
            "current_parameters": current_parameters,
            "adjustment_strategy": strategy,
            "user_id": user_id
        }
        
        response = await self.client.post(f"{self.base_url}/parameters/adjust", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def get_parameter_recommendations(self, equipment_id: str) -> Dict[str, Any]:
        """Get parameter adjustment recommendations"""
        
        response = await self.client.get(f"{self.base_url}/parameters/{equipment_id}/recommendations")
        response.raise_for_status()
        return response.json()
    
    async def rollback_parameters(self, equipment_id: str, rollback_count: int = 1, rollback_to_baseline: bool = False) -> Dict[str, Any]:
        """Rollback parameter adjustments"""
        
        request_data = {
            "rollback_count": rollback_count,
            "rollback_to_baseline": rollback_to_baseline
        }
        
        response = await self.client.post(f"{self.base_url}/parameters/{equipment_id}/rollback", json=request_data)
        response.raise_for_status()
        return response.json()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check system health"""
        
        response = await self.client.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()


async def demonstrate_single_calculation():
    """Demonstrate single RBI calculation"""
    
    print("🔧 Single RBI Calculation Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        # Sample equipment data
        equipment_data = {
            "equipment_id": "101-E-401A",
            "equipment_type": "pressure_vessel",
            "service_type": "sour_gas",
            "installation_date": "2005-01-15T00:00:00",
            "design_pressure": 25.0,
            "design_temperature": 150.0,
            "material": "Carbon Steel",
            "criticality_level": "High"
        }
        
        print(f"📊 Equipment: {equipment_data['equipment_id']}")
        print(f"Type: {equipment_data['equipment_type']}")
        print(f"Service: {equipment_data['service_type']}")
        
        # Perform calculation
        print(f"\n🔄 Performing RBI calculation...")
        result = await client.calculate_rbi(equipment_data, user_id="demo_user")
        
        if result["success"]:
            calc_result = result["calculation_result"]
            print(f"✅ Calculation successful!")
            print(f"Risk Level: {calc_result['risk_level']}")
            print(f"Inspection Interval: {calc_result['inspection_interval_months']} months")
            print(f"Confidence Score: {calc_result['confidence_score']:.1%}")
            print(f"Calculation Level: {calc_result['calculation_level']}")
            
            if calc_result.get("recommendations"):
                print(f"\n💡 Recommendations:")
                for rec in calc_result["recommendations"]:
                    print(f"  • {rec}")
        else:
            print(f"❌ Calculation failed: {result.get('message', 'Unknown error')}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_batch_calculation():
    """Demonstrate batch RBI calculations"""
    
    print("\n🔧 Batch RBI Calculation Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        # Sample equipment list
        equipment_list = [
            {
                "equipment_id": "101-E-401A",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "2005-01-15T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            },
            {
                "equipment_id": "101-E-401B",
                "equipment_type": "pressure_vessel",
                "service_type": "sour_gas",
                "installation_date": "2006-03-20T00:00:00",
                "design_pressure": 25.0,
                "design_temperature": 150.0,
                "material": "Carbon Steel",
                "criticality_level": "High"
            },
            {
                "equipment_id": "101-T-201A",
                "equipment_type": "tank",
                "service_type": "water",
                "installation_date": "2008-07-10T00:00:00",
                "design_pressure": 5.0,
                "design_temperature": 80.0,
                "material": "Carbon Steel",
                "criticality_level": "Medium"
            }
        ]
        
        print(f"📊 Processing {len(equipment_list)} equipment items:")
        for eq in equipment_list:
            print(f"  • {eq['equipment_id']} ({eq['equipment_type']})")
        
        # Perform batch calculation
        print(f"\n🔄 Performing batch RBI calculations...")
        result = await client.calculate_rbi_batch(equipment_list, user_id="demo_user")
        
        if result["success"]:
            print(f"✅ Batch calculation completed!")
            print(f"Total Processed: {result['total_processed']}")
            print(f"Successful: {result['successful_calculations']}")
            print(f"Failed: {result['failed_calculations']}")
            
            if result.get("processing_time_seconds"):
                print(f"Processing Time: {result['processing_time_seconds']:.2f} seconds")
            
            print(f"\n📋 Results Summary:")
            for calc_result in result["calculation_results"]:
                if calc_result["calculation_successful"]:
                    print(f"  • {calc_result['equipment_id']}: {calc_result['risk_level']} risk, {calc_result['inspection_interval_months']}mo interval")
                else:
                    print(f"  • {calc_result['equipment_id']}: ❌ Failed")
        else:
            print(f"❌ Batch calculation failed: {result.get('message', 'Unknown error')}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_configuration_management():
    """Demonstrate configuration management"""
    
    print("\n⚙️ Configuration Management Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        # Get current configuration
        print("📋 Getting current configuration...")
        config_result = await client.get_configuration()
        
        if config_result["success"]:
            print("✅ Configuration retrieved successfully")
            config = config_result["configuration"]
            print(f"Last Updated: {config_result['last_updated']}")
            print(f"Configuration sections: {list(config.keys())}")
        
        # Validate configuration update
        print(f"\n🔍 Validating configuration update...")
        test_updates = {
            "scoring_tables": {
                "pof_corrosion_rate": {
                    "low": {"min": 0, "max": 0.1, "score": 1},
                    "medium": {"min": 0.1, "max": 0.5, "score": 3},
                    "high": {"min": 0.5, "max": 1.0, "score": 5}
                }
            }
        }
        
        validation_result = await client.validate_configuration(test_updates, user_id="demo_admin")
        
        if validation_result["success"]:
            print("✅ Configuration validation passed")
            validation = validation_result["validation_result"]
            if validation.get("valid"):
                print("Configuration is valid and can be applied")
            else:
                print(f"Configuration has errors: {validation.get('errors', [])}")
        
        # Update configuration (commented out to avoid actual changes)
        # print(f"\n🔄 Updating configuration...")
        # update_result = await client.update_configuration(
        #     test_updates, 
        #     user_id="demo_admin", 
        #     reason="Demo configuration update"
        # )
        # 
        # if update_result["success"]:
        #     print("✅ Configuration updated successfully")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_reporting():
    """Demonstrate reporting capabilities"""
    
    print("\n📊 Reporting Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        # Generate calculation report
        print("📋 Generating calculation report...")
        report_result = await client.generate_calculation_report("101-E-401A", report_format="json")
        
        if report_result["success"]:
            print("✅ Calculation report generated successfully")
            report = report_result["report"]
            print(f"Report ID: {report.get('report_id', 'N/A')}")
            print(f"Generated At: {report_result['generated_at']}")
            print(f"Report sections: {report.get('sections', [])}")
        
        # Get system summary
        print(f"\n📈 Getting system summary...")
        summary_result = await client.get_system_summary(include_statistics=True, date_range_days=30)
        
        if summary_result["success"]:
            print("✅ System summary retrieved successfully")
            summary = summary_result["summary"]
            print(f"Total Equipment: {summary.get('total_equipment', 'N/A')}")
            print(f"Calculations Today: {summary.get('calculations_today', 'N/A')}")
            print(f"Average Risk Level: {summary.get('average_risk_level', 'N/A')}")
            
            if "audit_statistics" in summary:
                audit_stats = summary["audit_statistics"]
                print(f"Total Calculations: {audit_stats.get('total_calculations', 'N/A')}")
                print(f"Success Rate: {audit_stats.get('success_rate', 'N/A'):.1%}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_pattern_recognition():
    """Demonstrate pattern recognition capabilities"""
    
    print("\n🔍 Pattern Recognition Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        # Get equipment families
        print("👥 Getting equipment families...")
        families_result = await client.get_equipment_families(equipment_type="pressure_vessel", service_type="sour_gas")
        
        if families_result["success"]:
            print("✅ Equipment families retrieved successfully")
            families = families_result["families"]
            print(f"Total Families: {families_result['total_families']}")
            
            for family in families[:3]:  # Show first 3 families
                print(f"  • {family.get('family_name', 'Unknown')}: {family.get('member_count', 0)} members")
        
        # Analyze equipment patterns
        print(f"\n🔬 Analyzing equipment patterns...")
        equipment_data = {
            "equipment_id": "101-E-401A",
            "equipment_type": "pressure_vessel",
            "service_type": "sour_gas",
            "installation_date": "2005-01-15T00:00:00",
            "design_pressure": 25.0,
            "design_temperature": 150.0,
            "material": "Carbon Steel",
            "criticality_level": "High"
        }
        
        # Mock historical calculations (in real scenario, these would come from database)
        historical_calculations = []
        
        analysis_result = await client.analyze_equipment_patterns("101-E-401A", equipment_data, historical_calculations)
        
        if analysis_result["success"]:
            print("✅ Pattern analysis completed successfully")
            analysis = analysis_result["analysis_result"]
            print(f"Equipment ID: {analysis.get('equipment_id', 'N/A')}")
            print(f"Identified Families: {len(analysis.get('identified_families', []))}")
            print(f"Degradation Patterns: {len(analysis.get('degradation_patterns', []))}")
            
            confidence = analysis.get("confidence_assessment", {})
            if confidence:
                print(f"Overall Confidence: {confidence.get('overall', 0):.1%}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_parameter_adjustment():
    """Demonstrate parameter adjustment capabilities"""
    
    print("\n🔧 Parameter Adjustment Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        equipment_id = "101-E-401A"
        
        # Get parameter recommendations
        print("💡 Getting parameter recommendations...")
        recommendations_result = await client.get_parameter_recommendations(equipment_id)
        
        if recommendations_result["success"]:
            print("✅ Parameter recommendations retrieved successfully")
            recommendations = recommendations_result["recommendations"]
            print(f"Current Bias: {recommendations.get('current_bias', 'N/A')}")
            
            strategy_recs = recommendations.get("strategy_recommendations", {})
            print(f"Available Strategies: {list(strategy_recs.keys())}")
            
            for strategy, rec in strategy_recs.items():
                if rec.get("recommended"):
                    print(f"  • {strategy}: ✅ Recommended (confidence: {rec.get('confidence', 0):.1%})")
                else:
                    print(f"  • {strategy}: ❌ Not recommended")
        
        # Adjust parameters
        print(f"\n🔄 Adjusting parameters...")
        current_parameters = {
            "corrosion_rate_factor": 1.2,
            "age_factor": 1.15,
            "inspection_effectiveness": 0.75,
            "material_factor": 1.1,
            "environmental_factor": 1.3
        }
        
        adjustment_result = await client.adjust_parameters(
            equipment_id, 
            current_parameters, 
            strategy="balanced", 
            user_id="demo_user"
        )
        
        if adjustment_result["success"]:
            print("✅ Parameter adjustment completed successfully")
            adjustment = adjustment_result["adjustment_result"]
            print(f"Strategy Used: {adjustment.get('strategy_used', 'N/A')}")
            print(f"Bias Detected: {adjustment.get('bias_detected', 'N/A')}")
            print(f"Adjustments Made: {len(adjustment.get('adjustments_made', []))}")
            print(f"Overall Confidence: {adjustment.get('overall_confidence', 0):.1%}")
            
            if adjustment.get("adjustments_made"):
                print(f"\n📝 Parameter Changes:")
                for adj in adjustment["adjustments_made"]:
                    change_pct = (adj["adjusted_value"] - adj["original_value"]) / adj["original_value"] * 100
                    print(f"  • {adj['parameter_name']}: {adj['original_value']:.3f} → {adj['adjusted_value']:.3f} ({change_pct:+.1f}%)")
        
        # Demonstrate rollback (commented out to avoid actual changes)
        # print(f"\n↩️ Rolling back parameter adjustments...")
        # rollback_result = await client.rollback_parameters(equipment_id, rollback_count=1)
        # 
        # if rollback_result["success"]:
        #     print("✅ Parameter rollback completed successfully")
        #     rollback = rollback_result["rollback_result"]
        #     print(f"Message: {rollback.get('message', 'N/A')}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def demonstrate_health_check():
    """Demonstrate health check"""
    
    print("\n🏥 Health Check Demo")
    print("=" * 50)
    
    client = RBIAPIClient()
    
    try:
        print("🔍 Checking system health...")
        health_result = await client.health_check()
        
        if health_result["success"]:
            print("✅ System health check completed successfully")
            health = health_result["health"]
            print(f"Status: {health['status']}")
            print(f"Version: {health['version']}")
            print(f"Timestamp: {health['timestamp']}")
            
            print(f"\n🔧 Service Status:")
            services = health.get("services", {})
            for service, status in services.items():
                status_icon = "✅" if status == "operational" else "❌"
                print(f"  {status_icon} {service}: {status}")
        else:
            print("❌ System health check failed")
            print(f"Message: {health_result.get('message', 'Unknown error')}")
    
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        await client.close()


async def main():
    """Run all API demonstrations"""
    
    print("🚀 RBI REST API Usage Examples")
    print("=" * 60)
    print("Note: These examples assume the API server is running at http://localhost:8000")
    print("=" * 60)
    
    try:
        await demonstrate_single_calculation()
        await demonstrate_batch_calculation()
        await demonstrate_configuration_management()
        await demonstrate_reporting()
        await demonstrate_pattern_recognition()
        await demonstrate_parameter_adjustment()
        await demonstrate_health_check()
        
        print(f"\n🎉 All API demonstrations completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Demo failed with error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())