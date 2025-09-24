# CI/CD Pipeline Documentation

This project uses GitHub Actions for continuous integration and deployment. Below is an overview of the automated workflows.

## 🚀 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:** Push to `main` or `develop`, Pull requests to `main`

**Jobs:**

- **Install**: Sets up Node.js and caches dependencies
- **Lint**: Runs ESLint to check code quality
- **Build**: Builds the application using Vite
- **Deploy**: Deploys to GitHub Pages (main branch only)
- **Security**: Runs npm audit for security vulnerabilities

### 2. Pull Request Validation (`pr-validation.yml`)

**Triggers:** Pull requests to `main`

**Jobs:**

- **Quality Check**: Linting, building, and security audit
- **Dependency Validation**: Validates package.json and checks for outdated packages
- **Build Analysis**: Analyzes bundle size and comments on PR with build info

### 3. Release Workflow (`release.yml`)

**Triggers:** New release published, Manual dispatch

**Jobs:**

- **Release**: Creates production build, generates release archive, and deploys to GitHub Pages

## 🔧 Setup Requirements

### GitHub Repository Settings

1. **Enable GitHub Pages:**

   - Go to Settings → Pages
   - Set Source to "GitHub Actions"

2. **Branch Protection (Recommended):**
   - Go to Settings → Branches
   - Add rule for `main` branch:
     - Require status checks to pass
     - Require branches to be up to date
     - Include administrators

### Environment Variables

No additional environment variables are required for basic functionality.

## 📦 Deployment

### Automatic Deployment

- **Main Branch**: Automatically deploys to GitHub Pages on every push
- **Pull Requests**: Validates code but doesn't deploy

### Manual Deployment

1. Create a new release on GitHub
2. The release workflow will automatically build and deploy
3. Or use the "workflow_dispatch" trigger in the Actions tab

## 🔍 Monitoring

### Build Status

Check the Actions tab in your GitHub repository to monitor:

- Build success/failure
- Linting results
- Security audit results
- Deployment status

### Notifications

GitHub will automatically notify you of:

- Failed builds
- Security vulnerabilities
- Dependabot updates

## 🛠 Development Workflow

### For Contributors

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Branch Strategy

- `main`: Production-ready code, auto-deploys
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches

## 📋 Quality Gates

Before code reaches production, it must pass:

- ✅ ESLint checks
- ✅ Build successfully
- ✅ Security audit (high-level vulnerabilities)
- ✅ Peer review (for pull requests)

## 🔄 Dependency Management

- **Dependabot**: Automatically creates PRs for dependency updates
- **Schedule**: Weekly updates on Mondays
- **Major React updates**: Ignored (manual review required)

## 🎯 Performance

### Build Optimization

- Production builds are optimized with Vite
- Bundle analysis included in PR comments
- Asset compression enabled

### Caching Strategy

- Node modules cached across workflow runs
- Build artifacts cached between jobs
- Dependency resolution cached

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**

1. Check the Actions log for detailed error messages
2. Ensure all dependencies are correctly listed in package.json
3. Verify Node.js version compatibility

**Deployment Fails:**

1. Check GitHub Pages settings
2. Verify repository permissions
3. Ensure build artifacts are generated correctly

**Linting Errors:**

1. Run `npm run lint` locally
2. Fix linting issues before pushing
3. Consider adding ESLint disable comments for exceptions

## 📞 Support

For pipeline issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/actions)
2. Review workflow logs in the Actions tab
3. Open an issue if problems persist
