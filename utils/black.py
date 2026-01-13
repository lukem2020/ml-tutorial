#!/usr/bin/env python3
"""Script to run black formatter on all .py files in the repository."""
import subprocess
import sys
from pathlib import Path


def main():
    """Run black on all .py files in the repository."""
    repo_root = Path.cwd()

    print("Running black on all .py files...")
    print(f"Repository root: {repo_root}")
    print()

    try:
        # Run black on all .py files
        result = subprocess.run(
            ["black", "--include", r"\.py$", "."],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )

        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        # Exit with black's exit code
        sys.exit(result.returncode)

    except FileNotFoundError:
        print("Error: black not found. Please install it with: pip install black")
        sys.exit(1)
    except Exception as e:
        print(f"Error running black: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
