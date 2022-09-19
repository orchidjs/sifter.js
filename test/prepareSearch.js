var assert = require('assert');
var {Sifter} = require('@orchidjs/sifter');

describe('#prepareSearch()', function() {

	it('should normalize options', function() {
		var sifter = new Sifter([{fielda: 'a'}, {}]);
		var search = sifter.prepareSearch('a', {
			fields: [{field: 'fielda'}],
			sort: {field: 'fielda'},
			sort_empty: {field: 'fielda'}
		});
		//assert.equal(Array.isArray(search.options.fields), true);
		assert.equal(Array.isArray(search.options.sort), true);
		assert.equal(Array.isArray(search.options.sort_empty), true);
	});

	describe('returned object', function() {
		var sifter = new Sifter([{field: 'a'}, {}]);
		var search = sifter.prepareSearch('hello world');

		it('should contain "total" (int)', function() {
			assert.equal(search.total, 0);
		});
		it('should contain "tokens" (array)', function() {
			assert.equal(Array.isArray(search.tokens), true);
			assert.equal(search.tokens.length, 2);
		});
		it('should contain "items" (array)', function() {
			assert.equal(Array.isArray(search.items), true);
			assert.equal(search.items.length, 0);
		});
		it('should contain "options" (array)', function() {
			assert.equal(search.options !== null, true);
			assert.equal(typeof search.options, 'object');
			assert.equal(Array.isArray(search.options), false);
		});
	});

});
