import sys
from pathlib import Path
from components import agent, ml_pipeline, config

sys.path.insert(0, str(Path.cwd()))


def main():
    """Main entry point for the application."""
    # Start agent
    try:
        if agent.main():
            print("Agent started successfully")
    except Exception as e:
        print(f"Agent failed to start: {e}")

    # Start ML pipeline
    try:
        ml_pipeline.main()
        print("ML pipeline started successfully")
    except Exception as e:
        print(f"ML pipeline failed to start: {e}")


if __name__ == "__main__":
    main()
