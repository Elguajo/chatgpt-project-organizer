from bootstrap_tooling import PROFILE


def test_profile_is_medium_and_has_wxt():
    assert PROFILE["project_tier"] == "M"
    assert any(item.startswith("wxt@") for item in PROFILE["npm_dev_dependencies"])


def test_no_required_cloud_backend():
    joined = " ".join(PROFILE["local_required"]).lower()
    assert "backend" not in joined
    assert "database" not in joined
