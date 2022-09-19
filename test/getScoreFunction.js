var assert = require('assert');
var {Sifter} = require('@orchidjs/sifter');

describe('#getScoreFunction()', function() {

	it('should acknowledge AND "conjunction" option', function() {
		var score, search, sifter = new Sifter([]);

		score = sifter.getScoreFunction('one two', {fields: ['a','b'], conjunction: 'and'});
		assert.equal(score({a: 'one'}) > 0, false);
		assert.equal(score({a: 'one', b: 'two'}) > 0, true);
		assert.equal(score({a: 'one', b: 'one'}) > 0, false);
		assert.equal(score({a: 'one', b: 'three'}) > 0, false);
		assert.equal(score({a: 'three', b: 'three'}) > 0, false);
	});

	it('should acknowledge OR "conjunction" option', function() {
		var score, search, sifter = new Sifter([]);

		score = sifter.getScoreFunction('one two', {fields: ['a','b'], conjunction: 'or'});
		assert.equal(score({a: 'one'}) > 0, true);
		assert.equal(score({a: 'one', b: 'two'}) > 0, true);
		assert.equal(score({a: 'one', b: 'one'}) > 0, true);
		assert.equal(score({a: 'one', b: 'three'}) > 0, true);
		assert.equal(score({a: 'three', b: 'three'}) > 0, false);
	});

	describe('with query and options', function() {

		it('should return a function that returns a number', function() {
			var score, search, sifter = new Sifter([]);

			score = sifter.getScoreFunction('test', {fields: ['a','b']});
			assert.equal(typeof score({a: 'test'}), 'number');
			assert.equal(score({a: 'test'}) > 0, true);
			assert.equal(typeof score({}), 'number');
		});

	});

	describe('with pre-prepared search', function() {

		it('should return a function that returns a number', function() {
			var score, search, sifter = new Sifter([]);

			search = sifter.prepareSearch('test', {fields: ['a','b']});
			score = sifter._getScoreFunction(search);
			assert.equal(typeof score({a: 'test'}), 'number');
			assert.equal(score({a: 'test'}) > 0, true);
			assert.equal(typeof score({}), 'number');
		});

	});

});
