# Poetry Installation Fix

## Issue

If you're encountering the following error when running Poetry commands:

```
Traceback (most recent call last):
  File "/usr/bin/poetry", line 5, in <module>
    from poetry.console import main
  File "/usr/lib/python3/dist-packages/poetry/console/__init__.py", line 1, in <module>
    from .application import Application
  File "/usr/lib/python3/dist-packages/poetry/console/application.py", line 3, in <module>
    from cleo import Application as BaseApplication
ImportError: cannot import name 'Application' from 'cleo'
```

This is due to a compatibility issue between your Poetry installation and the Cleo package. This typically happens when:

1. You have multiple Poetry installations on your system
2. You have an older version of Poetry that's incompatible with the newer Cleo package
3. You have a newer version of Cleo that's incompatible with your Poetry version

## Solution

We've provided two scripts to help you fix this issue:

### 1. Quick Fix: Use the Working Poetry Installation

If you just want to use Poetry without fixing the system installation, you can use the `use_poetry.sh` script:

```bash
# Make the script executable
chmod +x use_poetry.sh

# Use it to run Poetry commands
./use_poetry.sh install --without evaluation
```

This script ensures that the correct Poetry installation from `~/.local/bin` is used.

### 2. Complete Fix: Reinstall Poetry

For a more permanent solution, use the `fix_poetry.sh` script:

```bash
# Make the script executable
chmod +x fix_poetry.sh

# Run the script
./fix_poetry.sh

# After the script completes, update your PATH
source ~/.bashrc

# Try running Poetry again
poetry install --without evaluation
```

This script will:
1. Remove all existing Poetry installations
2. Install Poetry 2.1.3 using pipx
3. Add Poetry to your PATH
4. Create a symbolic link to ensure the correct Poetry is used

## Manual Fix

If the scripts don't work for you, you can manually fix the issue:

1. Remove existing Poetry installations:
   ```bash
   pip uninstall -y poetry cleo
   pipx uninstall poetry
   sudo apt remove -y python3-poetry python-poetry poetry
   ```

2. Install Poetry using pipx:
   ```bash
   python3 -m pip install --user pipx
   python3 -m pipx ensurepath
   export PATH="$HOME/.local/bin:$PATH"
   pipx install poetry==2.1.3
   ```

3. Add Poetry to your PATH:
   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

4. Create a symbolic link (if needed):
   ```bash
   sudo ln -sf $HOME/.local/bin/poetry /usr/local/bin/poetry
   ```

## Verifying the Fix

After applying the fix, you should be able to run:

```bash
poetry --version
```

And see:

```
Poetry (version 2.1.3)
```

Then you can run:

```bash
cd /workspace/oh
poetry install --without evaluation
```

Without encountering any errors.