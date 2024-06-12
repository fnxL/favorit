import config from './schema';

// Load environment dependent configuration
const env = config.get('env');
config.loadFile('src/config/' + env + '.json');

// Perform validation
config.validate({ allowed: 'strict' });

export default config;
