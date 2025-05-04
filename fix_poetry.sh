#!/bin/bash

echo "Fixing Poetry installation..."

# Remove existing Poetry installation
echo "Removing existing Poetry installation..."
pip uninstall -y poetry
pip uninstall -y cleo

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

echo "Poetry installation fixed. Please run 'source ~/.bashrc' to update your PATH."
echo "Then try running 'poetry install --without evaluation' again."