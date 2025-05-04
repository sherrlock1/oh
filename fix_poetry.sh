#!/bin/bash

echo "Fixing Poetry installation..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Remove existing Poetry installations
echo "Removing existing Poetry installations..."

# Remove pip-installed Poetry
if command_exists pip; then
    pip uninstall -y poetry cleo 2>/dev/null
fi

if command_exists pip3; then
    pip3 uninstall -y poetry cleo 2>/dev/null
fi

# Remove pipx-installed Poetry
if command_exists pipx; then
    pipx uninstall poetry 2>/dev/null
fi

# Remove apt-installed Poetry (if applicable)
if command_exists apt; then
    sudo apt remove -y python3-poetry python-poetry poetry 2>/dev/null
fi

# Clean up any remaining Poetry files
echo "Cleaning up remaining Poetry files..."

# Check for the problematic Poetry installation
if [ -f "/usr/bin/poetry" ]; then
    echo "Removing /usr/bin/poetry..."
    sudo rm -f /usr/bin/poetry
fi

# Check for system-wide Poetry installation
if [ -d "/usr/lib/python3/dist-packages/poetry" ]; then
    echo "Removing system-wide Poetry installation..."
    sudo rm -rf /usr/lib/python3/dist-packages/poetry
fi

# Check for the specific problematic Cleo installation
if [ -d "/home/$USER/.local/lib/python3.10/site-packages/cleo" ]; then
    echo "Removing problematic Cleo installation..."
    rm -rf "/home/$USER/.local/lib/python3.10/site-packages/cleo"
fi

# Install Poetry using the recommended method
echo "Installing Poetry using pipx..."
python3 -m pip install --user pipx
python3 -m pipx ensurepath
export PATH="$HOME/.local/bin:$PATH"
pipx install poetry==2.1.3

# Add the path to .bashrc if it's not already there
if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" ~/.bashrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo "Added Poetry to PATH in ~/.bashrc"
fi

# Create a symbolic link to ensure the correct Poetry is used
if [ -d "/usr/local/bin" ]; then
    echo "Creating symbolic link in /usr/local/bin..."
    sudo ln -sf "$HOME/.local/bin/poetry" /usr/local/bin/poetry
fi

echo "Poetry installation fixed. Please run the following commands:"
echo ""
echo "  source ~/.bashrc"
echo "  cd /workspace/oh"
echo "  poetry install --without evaluation"
echo ""
echo "If you still encounter issues, please run:"
echo "  which -a poetry"
echo "to see all Poetry installations and ensure you're using the correct one."