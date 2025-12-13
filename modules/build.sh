#!/bin/bash
set -e  # hentikan script jika ada error

echo "🔧 [Casper AI] Compiling C++ module with pybind11..."

# Pastikan pybind11 terinstall (diperlukan untuk binding C++ ↔ Python)
pip install pybind11

# Compile binary_scanner.cpp menjadi modul Python (.so)
c++ -O3 -Wall -shared -std=c++11 -fPIC \
    $(python3 -m pybind11 --includes) \
    binary_scanner.cpp \
    -o binary_scanner$(python3-config --extension-suffix)

echo "✅ [Success] Module compiled as binary_scanner*.so"
echo "💡 You can now: import binary_scanner in Python"
