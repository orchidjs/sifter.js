var assert = require('assert');
var {Sifter} = require('../dist/cjs/sifter.js');

describe('#tokenize()', function() {
	var sifter, tokens;

	it('should return an empty array when given an empty string', function() {
		var sifter = new Sifter([]);
		var tokens = sifter.tokenize('');
		assert.equal(tokens.length, 0);
	});

	it('should return an array', function() {
		var sifter = new Sifter([]);
		var tokens = sifter.tokenize('hello world');
		assert.equal(Array.isArray(tokens), true);
	});

	it('should split string by spaces', function() {
		var sifter = new Sifter([]);
		var tokens = sifter.tokenize('hello world');
		assert.equal(tokens.length, 2);
	});

	describe('returned tokens', function() {
		beforeAll(function() {
			sifter = new Sifter([]);
			tokens = sifter.tokenize('hello world');
		});
		describe('"string" property', function() {
			it('should exist', function() {
				assert.notEqual(typeof tokens[0].string, 'undefined');
			});
			it('should be a string', function() {
				assert.equal(typeof tokens[0].string, 'string');
			});
			it('should be valid', function() {
				assert.equal(tokens[0].string, 'hello');
				assert.equal(tokens[1].string, 'world');
			});
		});
		describe('"regex" property', function() {
			it('should exist', function() {
				assert.notEqual(typeof tokens[0].regex, 'undefined');
			});
			it('should be a RegExp object', function() {
				assert.equal(tokens[0].regex instanceof RegExp, true);
			});
			it('should ignore case', function() {
				assert.equal(tokens[0].regex.test('HelLO'), true);
				assert.equal(tokens[1].regex.test('wORLD'), true);
			});
			it('should not be too greedy', function() {
				assert.equal(tokens[0].regex.test('afawfaf'), false);
			});
			it('should match international characters', function() {
				assert.equal(tokens[0].regex.test('Ḧęŀlö'), true);
				assert.equal(tokens[1].regex.test('ẘÕⓡlḋ'), true);
			});
		});
	});

});
