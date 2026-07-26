from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def setup_function():
    activities["Chess Club"]["participants"] = ["michael@mergington.edu", "daniel@mergington.edu"]
    activities["Programming Class"]["participants"] = ["emma@mergington.edu", "sophia@mergington.edu"]
    activities["Gym Class"]["participants"] = ["john@mergington.edu", "olivia@mergington.edu"]


def test_unregister_participant_from_activity():
    signup_response = client.post(
        "/activities/Chess Club/signup?email=student@mergington.edu"
    )
    assert signup_response.status_code == 200

    unregister_response = client.delete(
        "/activities/Chess%20Club/participants/student@mergington.edu"
    )

    assert unregister_response.status_code == 200
    assert unregister_response.json()["message"] == (
        "Unregistered student@mergington.edu from Chess Club"
    )
    assert "student@mergington.edu" not in activities["Chess Club"]["participants"]
