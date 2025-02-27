## Project Tree

```
flutter-generator/
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── src/                   # Source code directory
│   ├── index.ts           # Main entry point
│   ├── cli/               # Command-line interface handling
│   │   ├── index.ts       # CLI entry point
│   │   ├── args.ts        # Command-line arguments parser
│   │   └── logger.ts      # Logging utilities
│   ├── core/              # Core generator functionality
│   │   ├── generator.ts   # Main generator class
│   │   ├── builder.ts     # App building logic
│   │   └── validator.ts   # Config validation
│   ├── templates/         # Handlebars templates
│   │   ├── main.hbs       # Template for main.dart
│   │   ├── pubspec.hbs    # Template for pubspec.yaml
│   │   └── index.ts       # Template loader/registry
│   ├── models/            # TypeScript interfaces/types
│   │   ├── config.ts      # Configuration interface
│   │   └── app.ts         # App structure interface
│   ├── utils/             # Utility functions
│   │   ├── file.ts        # File system operations
│   │   ├── image.ts       # Image downloading utilities
│   │   └── template.ts    # Template processing
│   └── services/          # External service integrations
│       └── imageKit.ts    # ImageKit integration
├── dist/                  # Compiled JavaScript output
├── templates/             # Raw template files (not in src)
│   ├── main.dart.hbs
│   ├── pubspec.yaml.hbs
│   ├── screens/           # Screen template files
│   └── widgets/           # Widget template files
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
└── README.md              # Project documentation
```
