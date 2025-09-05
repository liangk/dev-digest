# DevDigest

[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com/)

A modern web application built with Angular that serves as a technical blog and project showcase. The application features a clean, responsive design with a focus on performance and user experience.

## ✨ Features

- 📝 Blog system with markdown support
- 📱 Responsive design for all devices
- 🎨 Modern UI with smooth animations
- ⚡ Fast page loads with lazy loading
- 🔍 SEO-friendly URLs and metadata
- 📦 Component-based architecture

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+) or Yarn (v1.22+)
- Angular CLI (v15+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dev-digest.git
   cd dev-digest
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

```bash
ng serve
```

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
ng build
```

For a production build:

```bash
ng build --configuration production
```

### Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

```bash
ng test
```

### Running End-to-End Tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice.

```bash
ng e2e
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── about/               # About page
│   ├── blog/                # Blog post components
│   ├── contact/             # Contact page
│   ├── home/                # Home page components
│   ├── layout/              # Main layout components
│   ├── models/              # TypeScript interfaces
│   ├── app.component.*      # Root component
│   └── app.routes.ts        # Application routes
├── assets/                  # Static assets
│   └── fonts/               # Custom fonts
└── styles/                  # Global styles
```

## 📚 Adding New Blog Posts

1. Create a new markdown file in `public/blog/` with the following frontmatter:
   ```yaml
   ---
   title: "Your Blog Post Title"
   slug: your-blog-post-slug
   date: YYYY-MM-DD
   author: "Author Name"
   description: "Brief description of the post"
   repo: "https://github.com/yourusername/your-repo"  # Optional
   ---
   ```

2. Add an entry to `public/blog/list.json`:
   ```json
   {
     "title": "Your Blog Post Title",
     "slug": "your-blog-post-slug",
     "date": "YYYY-MM-DD",
     "author": "Author Name",
     "description": "Brief description of the post"
   }
   ```

## 🛠️ Development

### Code Scaffolding

Generate a new component:
```bash
ng generate component component-name
```

Generate a new service:
```bash
ng generate service service-name
```

### Styling Guidelines

- Use SCSS for styling
- Follow BEM (Block Element Modifier) methodology
- Keep styles scoped to components
- Use CSS variables for theming
- Mobile-first responsive design

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Angular](https://angular.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Sass](https://sass-lang.com/)
- [Marked](https://marked.js.org/) - Markdown parser
- [Google Fonts](https://fonts.google.com/)

---

<p align="center">
  Made with ❤️ by [Your Name]
</p>

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
