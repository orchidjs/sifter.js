import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve'; // so Rollup can resolve imports without file extensions and `node_modules`
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configs = [];
const banner = `/*! sifter.js | https://github.com/orchidjs/sifter.js | Apache License (v2) */`;

const extensions = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs',
];

var babel_config = babel({
	extensions: extensions,
	babelHelpers: 'bundled',
	configFile: path.resolve(__dirname,'babel.config.json'),
});

var resolve_config = resolve({
	extensions: extensions,
});

var terser_config = terser({
  mangle: true,
  format: {
    semicolons: false,
    comments: function (node, comment) {
      var text = comment.value;
      var type = comment.type;
      if (type == "comment2") {
        // multiline comment
        return /\* sifter.js/i.test(text);
      }
    },
  },
});


// umd
configs.push({
		input: path.resolve(__dirname,'../lib/sifter.ts'),
		output: {
			name: 'sifter',
			file: `dist/umd/sifter.js`,
			format: 'umd',
			sourcemap: true,
			banner: banner
		},
		plugins:[
			babel_config,
			resolve_config
		]
	});

// umd min
configs.push({
		input: path.resolve(__dirname,'../lib/sifter.ts'),
		output: {
			name: 'sifter',
			file: `dist/umd/sifter.min.js`,
			format: 'umd',
			sourcemap: true,
			banner: banner
		},
		plugins:[
			babel_config,
			resolve_config,
			terser_config
		]
	});


export default configs;
