#!/bin/bash

# Use the Poetry installation from ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"

# Run Poetry with all arguments passed to this script
poetry "$@"