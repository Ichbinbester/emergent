#!/usr/bin/env python3
"""
Backend API Testing for Gaming & Movie Collection Website
Tests all CRUD operations for Games and Movie Series APIs
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Backend URL from environment
BACKEND_URL = "https://89b7ed77-dd51-4448-ba87-9ba0291c9d64.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_games = []
        self.created_series = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "Gaming & Movie Collection API" in data.get("message", ""):
                    self.log_test("Health Check", True, "API is running")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected message: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_create_game(self):
        """Test creating games with various data"""
        test_games = [
            {
                "name": "The Witcher 3: Wild Hunt",
                "image_url": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
                "time_played": "120 hours",
                "completion_status": "Completed",
                "rating": 10,
                "problems": "",
                "notes": "Amazing open world RPG with great story",
                "platinum_status": True,
                "trophies_earned": 78,
                "trophies_total": 78
            },
            {
                "name": "Cyberpunk 2077",
                "image_url": "https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg",
                "time_played": "45 hours",
                "completion_status": "In Progress",
                "rating": 7,
                "problems": "Some bugs and performance issues",
                "notes": "Good story but technical issues",
                "platinum_status": False,
                "trophies_earned": 25,
                "trophies_total": 44
            },
            {
                "name": "Elden Ring",
                "image_url": "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
                "time_played": "0 hours",
                "completion_status": "Not Started",
                "rating": 1,
                "problems": "",
                "notes": "Waiting to start this masterpiece",
                "platinum_status": False,
                "trophies_earned": 0,
                "trophies_total": 42
            }
        ]
        
        for i, game_data in enumerate(test_games):
            try:
                response = self.session.post(f"{self.base_url}/games", json=game_data)
                if response.status_code == 200:
                    game = response.json()
                    self.created_games.append(game)
                    self.log_test(f"Create Game {i+1} ({game_data['name']})", True, 
                                f"Created with ID: {game['id']}")
                else:
                    self.log_test(f"Create Game {i+1}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Game {i+1}", False, f"Error: {str(e)}")
    
    def test_get_all_games(self):
        """Test retrieving all games"""
        try:
            response = self.session.get(f"{self.base_url}/games")
            if response.status_code == 200:
                games = response.json()
                if isinstance(games, list) and len(games) >= len(self.created_games):
                    self.log_test("Get All Games", True, f"Retrieved {len(games)} games")
                else:
                    self.log_test("Get All Games", False, f"Expected list with at least {len(self.created_games)} games, got: {games}")
            else:
                self.log_test("Get All Games", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get All Games", False, f"Error: {str(e)}")
    
    def test_get_game_by_id(self):
        """Test retrieving specific game by ID"""
        if not self.created_games:
            self.log_test("Get Game by ID", False, "No games created to test with")
            return
            
        game_id = self.created_games[0]['id']
        try:
            response = self.session.get(f"{self.base_url}/games/{game_id}")
            if response.status_code == 200:
                game = response.json()
                if game['id'] == game_id:
                    self.log_test("Get Game by ID", True, f"Retrieved game: {game['name']}")
                else:
                    self.log_test("Get Game by ID", False, f"ID mismatch: expected {game_id}, got {game['id']}")
            else:
                self.log_test("Get Game by ID", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Game by ID", False, f"Error: {str(e)}")
    
    def test_update_game(self):
        """Test updating game data"""
        if not self.created_games:
            self.log_test("Update Game", False, "No games created to test with")
            return
            
        game_id = self.created_games[0]['id']
        update_data = {
            "completion_status": "Platinum",
            "platinum_status": True,
            "trophies_earned": 78,
            "rating": 10,
            "notes": "Updated: Achieved platinum trophy!"
        }
        
        try:
            response = self.session.put(f"{self.base_url}/games/{game_id}", json=update_data)
            if response.status_code == 200:
                updated_game = response.json()
                if (updated_game['completion_status'] == "Platinum" and 
                    updated_game['platinum_status'] == True):
                    self.log_test("Update Game", True, "Game updated successfully")
                else:
                    self.log_test("Update Game", False, f"Update not reflected: {updated_game}")
            else:
                self.log_test("Update Game", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Update Game", False, f"Error: {str(e)}")
    
    def test_game_validation(self):
        """Test game validation (rating 1-10, required fields)"""
        # Test invalid rating
        invalid_game = {
            "name": "Test Game",
            "rating": 15  # Invalid rating > 10
        }
        
        try:
            response = self.session.post(f"{self.base_url}/games", json=invalid_game)
            if response.status_code == 422:  # Validation error
                self.log_test("Game Validation (Invalid Rating)", True, "Correctly rejected invalid rating")
            else:
                self.log_test("Game Validation (Invalid Rating)", False, 
                            f"Should reject invalid rating, got status: {response.status_code}")
        except Exception as e:
            self.log_test("Game Validation (Invalid Rating)", False, f"Error: {str(e)}")
        
        # Test missing required field
        incomplete_game = {}  # Missing required 'name' field
        
        try:
            response = self.session.post(f"{self.base_url}/games", json=incomplete_game)
            if response.status_code == 422:  # Validation error
                self.log_test("Game Validation (Missing Name)", True, "Correctly rejected missing name")
            else:
                self.log_test("Game Validation (Missing Name)", False, 
                            f"Should reject missing name, got status: {response.status_code}")
        except Exception as e:
            self.log_test("Game Validation (Missing Name)", False, f"Error: {str(e)}")
    
    def test_create_movie_series(self):
        """Test creating movie series with multiple movies"""
        test_series = [
            {
                "series_name": "Star Wars",
                "movies": [
                    {"title": "A New Hope", "notes": "The original classic"},
                    {"title": "The Empire Strikes Back", "notes": "Best of the trilogy"},
                    {"title": "Return of the Jedi", "notes": "Epic conclusion"}
                ]
            },
            {
                "series_name": "Marvel Cinematic Universe",
                "movies": [
                    {"title": "Iron Man", "notes": "Started it all"},
                    {"title": "The Avengers", "notes": "Epic team-up"},
                    {"title": "Endgame", "notes": "Perfect finale"}
                ]
            },
            {
                "series_name": "The Matrix",
                "movies": []  # Empty series to test adding movies later
            }
        ]
        
        for i, series_data in enumerate(test_series):
            try:
                response = self.session.post(f"{self.base_url}/movie-series", json=series_data)
                if response.status_code == 200:
                    series = response.json()
                    self.created_series.append(series)
                    self.log_test(f"Create Movie Series {i+1} ({series_data['series_name']})", True,
                                f"Created with ID: {series['id']}")
                else:
                    self.log_test(f"Create Movie Series {i+1}", False,
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Movie Series {i+1}", False, f"Error: {str(e)}")
    
    def test_get_all_movie_series(self):
        """Test retrieving all movie series"""
        try:
            response = self.session.get(f"{self.base_url}/movie-series")
            if response.status_code == 200:
                series_list = response.json()
                if isinstance(series_list, list) and len(series_list) >= len(self.created_series):
                    self.log_test("Get All Movie Series", True, f"Retrieved {len(series_list)} series")
                else:
                    self.log_test("Get All Movie Series", False, 
                                f"Expected list with at least {len(self.created_series)} series, got: {series_list}")
            else:
                self.log_test("Get All Movie Series", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get All Movie Series", False, f"Error: {str(e)}")
    
    def test_get_movie_series_by_id(self):
        """Test retrieving specific movie series by ID"""
        if not self.created_series:
            self.log_test("Get Movie Series by ID", False, "No series created to test with")
            return
            
        series_id = self.created_series[0]['id']
        try:
            response = self.session.get(f"{self.base_url}/movie-series/{series_id}")
            if response.status_code == 200:
                series = response.json()
                if series['id'] == series_id:
                    self.log_test("Get Movie Series by ID", True, f"Retrieved series: {series['series_name']}")
                else:
                    self.log_test("Get Movie Series by ID", False, 
                                f"ID mismatch: expected {series_id}, got {series['id']}")
            else:
                self.log_test("Get Movie Series by ID", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Movie Series by ID", False, f"Error: {str(e)}")
    
    def test_add_movie_to_series(self):
        """Test adding movies to existing series"""
        if not self.created_series:
            self.log_test("Add Movie to Series", False, "No series created to test with")
            return
        
        # Find The Matrix series (should be empty)
        matrix_series = None
        for series in self.created_series:
            if series['series_name'] == "The Matrix":
                matrix_series = series
                break
        
        if not matrix_series:
            self.log_test("Add Movie to Series", False, "Matrix series not found")
            return
        
        new_movies = [
            {"title": "The Matrix", "notes": "Mind-bending original"},
            {"title": "The Matrix Reloaded", "notes": "Action-packed sequel"},
            {"title": "The Matrix Revolutions", "notes": "Epic conclusion"}
        ]
        
        for i, movie in enumerate(new_movies):
            try:
                response = self.session.post(f"{self.base_url}/movie-series/{matrix_series['id']}/movies", 
                                           json=movie)
                if response.status_code == 200:
                    updated_series = response.json()
                    if len(updated_series['movies']) == i + 1:
                        self.log_test(f"Add Movie {i+1} to Series", True, 
                                    f"Added '{movie['title']}' to Matrix series")
                    else:
                        self.log_test(f"Add Movie {i+1} to Series", False, 
                                    f"Movie count mismatch: expected {i+1}, got {len(updated_series['movies'])}")
                else:
                    self.log_test(f"Add Movie {i+1} to Series", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Add Movie {i+1} to Series", False, f"Error: {str(e)}")
    
    def test_update_movie_series(self):
        """Test updating movie series"""
        if not self.created_series:
            self.log_test("Update Movie Series", False, "No series created to test with")
            return
            
        series_id = self.created_series[0]['id']
        update_data = {
            "series_name": "Star Wars Saga (Updated)"
        }
        
        try:
            response = self.session.put(f"{self.base_url}/movie-series/{series_id}", json=update_data)
            if response.status_code == 200:
                updated_series = response.json()
                if "Updated" in updated_series['series_name']:
                    self.log_test("Update Movie Series", True, "Series name updated successfully")
                else:
                    self.log_test("Update Movie Series", False, f"Update not reflected: {updated_series}")
            else:
                self.log_test("Update Movie Series", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Update Movie Series", False, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test 404 errors for non-existent IDs"""
        fake_id = "non-existent-id-12345"
        
        # Test 404 for game
        try:
            response = self.session.get(f"{self.base_url}/games/{fake_id}")
            if response.status_code == 404:
                self.log_test("404 Error Handling (Game)", True, "Correctly returned 404 for non-existent game")
            else:
                self.log_test("404 Error Handling (Game)", False, 
                            f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("404 Error Handling (Game)", False, f"Error: {str(e)}")
        
        # Test 404 for movie series
        try:
            response = self.session.get(f"{self.base_url}/movie-series/{fake_id}")
            if response.status_code == 404:
                self.log_test("404 Error Handling (Movie Series)", True, "Correctly returned 404 for non-existent series")
            else:
                self.log_test("404 Error Handling (Movie Series)", False, 
                            f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("404 Error Handling (Movie Series)", False, f"Error: {str(e)}")
    
    def test_delete_operations(self):
        """Test delete operations"""
        # Delete a game
        if self.created_games:
            game_id = self.created_games[-1]['id']  # Delete last created game
            try:
                response = self.session.delete(f"{self.base_url}/games/{game_id}")
                if response.status_code == 200:
                    # Verify it's deleted
                    verify_response = self.session.get(f"{self.base_url}/games/{game_id}")
                    if verify_response.status_code == 404:
                        self.log_test("Delete Game", True, "Game deleted successfully")
                    else:
                        self.log_test("Delete Game", False, "Game still exists after deletion")
                else:
                    self.log_test("Delete Game", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Delete Game", False, f"Error: {str(e)}")
        
        # Delete a movie series
        if self.created_series:
            series_id = self.created_series[-1]['id']  # Delete last created series
            try:
                response = self.session.delete(f"{self.base_url}/movie-series/{series_id}")
                if response.status_code == 200:
                    # Verify it's deleted
                    verify_response = self.session.get(f"{self.base_url}/movie-series/{series_id}")
                    if verify_response.status_code == 404:
                        self.log_test("Delete Movie Series", True, "Series deleted successfully")
                    else:
                        self.log_test("Delete Movie Series", False, "Series still exists after deletion")
                else:
                    self.log_test("Delete Movie Series", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Delete Movie Series", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTING - Gaming & Movie Collection")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()
        
        # Health check first
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        print("\n--- GAMES API TESTING ---")
        self.test_create_game()
        self.test_get_all_games()
        self.test_get_game_by_id()
        self.test_update_game()
        self.test_game_validation()
        
        print("\n--- MOVIE SERIES API TESTING ---")
        self.test_create_movie_series()
        self.test_get_all_movie_series()
        self.test_get_movie_series_by_id()
        self.test_add_movie_to_series()
        self.test_update_movie_series()
        
        print("\n--- ERROR HANDLING TESTING ---")
        self.test_error_handling()
        
        print("\n--- DELETE OPERATIONS TESTING ---")
        self.test_delete_operations()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)