// modules/binary_scanner.cpp
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <fstream>
#include <vector>
#include <string>

std::vector<uint8_t> read_file(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    return std::vector<uint8_t>(std::istreambuf_iterator<char>(file), {});
}

bool contains_pattern(const std::vector<uint8_t>& data, const std::string& pattern) {
    std::string s(data.begin(), data.end());
    return s.find(pattern) != std::string::npos;
}

// Ekspor ke Python
PYBIND11_MODULE(binary_scanner, m) {
    m.doc() = "C++ binary analysis module";
    m.def("read_file", &read_file, "Read binary file");
    m.def("contains_pattern", &contains_pattern, "Check if binary contains string pattern");
}
