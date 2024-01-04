// swift-tools-version: 5.9

import PackageDescription

let package = Package(
  name: "homeassistant",
  platforms: [
    .macOS(.v12),
  ],
  dependencies: [
    .package(url: "https://github.com/raycast/raycast-extension-macro", from: "0.1.0")
  ],
  targets: [
    .executableTarget(
      name: "homeassistant",
      dependencies: [
        .product(name: "RaycastExtensionMacro", package: "raycast-extension-macro"),
      ]
    ),
  ]
)
