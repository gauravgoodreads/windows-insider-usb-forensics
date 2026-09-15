install:
	python -m pip install -r requirements.txt
demo:
	python scripts/run_pipeline.py --demo
test:
	python -m pytest -q
validate:
	python scripts/validate_project.py
dashboard:
	python dashboard/app.py

