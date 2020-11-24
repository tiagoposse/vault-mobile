# Vault-mobile

Access Vault in an easy UI in the mobile.

The app can work in 2 ways:
- online-only mode: The app works as a simple interface for vault, more friendly towards mobile
- offline-supported mode: The app saves a local encrypted copy of the secrets and works mainly with the local database, synchronising periodically with the Vault instance.

In both modes the Vault instance is the source of truth.

## Install the dependencies
```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
npm run lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
