var assert = require('assert');
var Sifter = require('../build/umd/sifter.js');


describe('#search()', function() {

	it('should not throw if an element does not contain search field', function() {
		assert.doesNotThrow(function() {
			var sifter = new Sifter([{field: 'a'}, {}]);
			var result = sifter.search('hello', {fields: ['field']});
		});
	});

	it('should allow "fields" option to be a string', function() {
		var sifter = new Sifter([{field: 'a'}, {}]);
		var result = sifter.search('a', {fields: 'field'});
		assert.equal(result.items[0].id, 0);
	});

	it('should allow to search nested fields', function() {
		var sifter = new Sifter([
			{fields: {nested: 'aaa'}},
			{fields: {nested: 'add'}},
			{fields: {nested: 'abb'}}
		]);
		var result = sifter.search('aaa', {
			fields: 'fields.nested',
			nesting: true
		});

		assert.equal(result.items.length, 1);
		assert.equal(result.items[0].id, 0);
	});

	it('should allow word boundaries to be respected', function() {
		var sifter = new Sifter([
			{name: 'John Smith'},
			{name: 'Jane Doe'},
		]);
		var result = sifter.search('mith', {fields: 'name'});
		assert.equal(result.items.length, 1);

		var result = sifter.search('mith', {fields: 'name', respect_word_boundaries: true});
		assert.equal(result.items.length, 0);

		var result = sifter.search('Smi', {fields: 'name', respect_word_boundaries: true});
		assert.equal(result.items.length, 1);

		var result = sifter.search('John Sm', {fields: 'name', respect_word_boundaries: true});
		assert.equal(result.items.length, 1);

		var result = sifter.search('ohn Smith', {fields: 'name', respect_word_boundaries: true, conjunction: 'and'});
		assert.equal(result.items.length, 0);
	});

	it('should work if search data is an object', function() {
		var sifter = new Sifter({a:{field: 'a'}, b:{field:'b'}});
		var result = sifter.search('a', {fields: ['field']});
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0].id, 'a');
	});

	describe('sorting', function() {
		it('should respect "sort_empty" option when query absent', function() {
			var sifter = new Sifter([
				{field: 'aaa'},
				{field: 'add'},
				{field: 'abb'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: {field: 'field', direction: 'asc'},
				sort_empty: {field: 'field', direction: 'desc'}
			});
			assert.equal(result.items[0].id, 1);
			assert.equal(result.items[1].id, 2);
			assert.equal(result.items[2].id, 0);
		});
		it('should work with one field (as object)', function() {
			var sifter = new Sifter([
				{field: 'aaa'},
				{field: 'add'},
				{field: 'abb'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: {field: 'field'}
			});
			assert.equal(result.items[0].id, 0);
			assert.equal(result.items[1].id, 2);
			assert.equal(result.items[2].id, 1);
		});
		it('should work with one field (as array)', function() {
			var sifter = new Sifter([
				{field: 'aaa'},
				{field: 'add'},
				{field: 'abb'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: [{field: 'field'}]
			});
			assert.equal(result.items[0].id, 0);
			assert.equal(result.items[1].id, 2);
			assert.equal(result.items[2].id, 1);
		});
		it('should work with multiple fields and respect priority', function() {
			var sifter = new Sifter([
				{a: 'bbb', b: 'bbb'},
				{a: 'bbb', b: 'ccc'},
				{a: 'bbb', b: 'aaa'},
				{a: 'aaa'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: [
					{field: 'a'},
					{field: 'b'}
				]
			});
			assert.equal(result.items[0].id, 3);
			assert.equal(result.items[1].id, 2);
			assert.equal(result.items[2].id, 0);
			assert.equal(result.items[3].id, 1);
		});
		it('should respect numeric fields', function() {
			var sifter = new Sifter([
				{field: 1.0},
				{field: 12.9},
				{field: 9.1},
				{field: -9.0}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: [{field: 'field'}]
			});
			assert.equal(result.items[0].id, 3);
			assert.equal(result.items[1].id, 0);
			assert.equal(result.items[2].id, 2);
			assert.equal(result.items[3].id, 1);
		});
		it('should respect sort direction', function() {
			var sifter = new Sifter([
				{a: 'bbb', b: 'rrr'},
				{a: 'bbb', b: 'aaa'},
				{a: 'aaa', b: 'rrr'},
				{a: 'aaa', b: 'aaa'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: [
					{field: 'b', direction: 'desc'},
					{field: 'a', direction: 'asc'}
				]
			});
			assert.equal(result.items[0].id, 2);
			assert.equal(result.items[1].id, 0);
			assert.equal(result.items[2].id, 3);
			assert.equal(result.items[3].id, 1);
		});
		it('should add implicit "$score" field when query present', function() {
			var sifter = new Sifter([
				{field: 'yoo'},
				{field: 'book'}
			]);
			var result = sifter.search('oo', {
				fields: 'field',
				sort: [{field: 'field'}]
			});
			assert.equal(result.items[0].id, 0);
			assert.equal(result.items[1].id, 1);
		});
		it('should not add implicit "$score" field if explicitly given', function() {
			var sifter = new Sifter([
				{field: 'boooo'},
				{field: 'yoo'},
				{field: 'aaa'}
			]);
			var result = sifter.search('oo', {
				filter: false,
				fields: 'field',
				sort: [{field: 'field'}, {field: '$score'}]
			});
			assert.equal(result.items[0].id, 2);
			assert.equal(result.items[1].id, 0);
			assert.equal(result.items[2].id, 1);
		});
		it('should be locale-aware', function() {
			var sifter = new Sifter([
				{field: 'Zoom Test'},
				{field: 'Água Test'}
			]);
			var result = sifter.search('', {
				fields: 'field',
				sort: [{field: 'field', direction: 'asc'}]
			});
			assert.equal(result.items[0].id, 1);
			assert.equal(result.items[1].id, 0);
		});
		it('should work with nested fields', function() {
			var sifter = new Sifter([
				{fields: {nested: 'aaa'}},
				{fields: {nested: 'add'}},
				{fields: {nested: 'abb'}}
			]);
			var result = sifter.search('', {
				fields: [],
				sort: {field: 'fields.nested'},
				nesting: true
			});
			assert.equal(result.items[0].id, 0);
			assert.equal(result.items[1].id, 2);
			assert.equal(result.items[2].id, 1);
		});
	});

	describe('returned results', function() {
		var sifter, options, result, result_empty, result_all;

		before(function() {
			sifter = new Sifter([
				{title: 'Matterhorn', location: 'Switzerland', continent: 'Europe'},
				{title: 'Eiger', location: 'Switzerland', continent: 'Europe'},
				{title: 'Everest', location: 'Nepal', continent: 'Asia'},
				{title: 'Gannett', location: 'Wyoming', continent: 'North America'},
				{title: 'Denali', location: 'Alaska', continent: 'North America'}
			]);

			options      = {limit: 1, fields: ['title', 'location', 'continent']};
			result       = sifter.search('switzerland europe', options);
			result_empty = sifter.search('awawfawfawf', options);
			result_all   = sifter.search('', {
				fields: ['title', 'location', 'continent'],
				sort: [{field: 'title'}]
			});
		});

		it('should not vary when using an array vs a hash as a data source', function() {
			var sifter_hash = new Sifter({
				'a': {title: 'Matterhorn', location: 'Switzerland', continent: 'Europe'},
				'b': {title: 'Eiger', location: 'Switzerland', continent: 'Europe'},
				'c': {title: 'Everest', location: 'Nepal', continent: 'Asia'},
				'd': {title: 'Gannett', location: 'Wyoming', continent: 'North America'},
				'e': {title: 'Denali', location: 'Alaska', continent: 'North America'}
			});
			var result_hash = sifter.search('switzerland europe', options);
			assert.deepEqual(result_hash, result);
		});

		describe('"items" array', function() {
			it('should be an array', function() {
				assert.equal(Array.isArray(result.items), true);
				assert.equal(Array.isArray(result_empty.items), true);
				assert.equal(Array.isArray(result_all.items), true);
			});
			it('should include entire set if no query provided', function() {
				assert.equal(result_all.items.length, 5);
			});
			it('should not have a length that exceeds "limit" option', function() {
				assert.equal(result.items.length > options.limit, false);
			});
			it('should not contain any items with a score not equal to 1 (without query)', function() {
				for (var i = 0, n = result_all.items.length; i < n; i++) {
					assert.equal(result_all.items[i].score, 1);
				}
			});
			it('should not contain any items with a score of zero (with query)', function() {
				for (var i = 0, n = result.items.length; i < n; i++) {
					assert.notEqual(result.items[i].score, 0);
				}
			});
			it('should be empty when no results match', function() {
				assert.equal(result_empty.items.length , 0);
			});

			describe('elements', function() {
				it('should be objects', function() {
					assert.equal(typeof result.items[0], 'object');
					assert.equal(Array.isArray(result.items[0]), false);
				});
				describe('"score" property', function() {
					it('should exist', function() {
						assert.notEqual(typeof result.items[0].score, 'undefined');
						assert.notEqual(typeof result_all.items[0].score, 'undefined');
					});
					it('should be a number', function() {
						assert.equal(typeof result.items[0].score, 'number');
						assert.equal(typeof result_all.items[0].score, 'number');
					});
				});
				describe('"id" property', function() {
					it('should exist', function() {
						assert.notEqual(typeof result.items[0].id, 'undefined');
						assert.notEqual(typeof result_all.items[0].id, 'undefined');
					});
				});
			});
		});

		describe('"options"', function() {
			it('should not be a reference to original options', function() {
				assert.equal(result.options === options, false);
			});
			it('should match original search options', function() {
				assert.deepEqual(result.options, options);
			});
		});

		describe('"tokens"', function() {
			it('should be an array', function() {
				assert.equal(Array.isArray(result.tokens), true);
			});
			describe('elements', function() {
				it('should be a object', function() {
					assert.equal(typeof result.tokens[0], 'object');
					assert.equal(Array.isArray(result.tokens[0]), false);
				});
				describe('"string" property', function() {
					it('should exist', function() {
						assert.notEqual(typeof result.tokens[0].string, 'undefined');
					});
					it('should be a string', function() {
						assert.equal(typeof result.tokens[0].string, 'string');
					});
					it('should be valid', function() {
						assert.equal(result.tokens[0].string, 'switzerland');
						assert.equal(result.tokens[1].string, 'europe');
					});
				});
				describe('"regex" property', function() {
					it('should exist', function() {
						assert.notEqual(typeof result.tokens[0].regex, 'undefined');
					});
					it('should be a RegExp object', function() {
						assert.equal(result.tokens[0].regex instanceof RegExp, true);
					});
				});
			});
		});

		describe('"query"', function() {
			it('should match original query', function() {
				assert.equal(result.query, 'switzerland europe');
			});
		});

		describe('"total"', function() {
			it('should be an integer', function() {
				assert.equal(typeof result.total, 'number');
				assert.equal(Math.floor(result.total), Math.ceil(result.total));
			});
			it('should be valid', function() {
				assert.equal(result.total, 2);
				assert.equal(result_empty.total, 0);
			});
		});

	});

	describe('#field searching', function() {

		var data = [
			{fieldx: 'aa', fieldy: 'a'},
			{fieldx: 'ab', fieldy: 'a', fieldz: 'b' }
		];
		var sifter = new Sifter(data);

		it('should return two matching rows', function() {
			var result = sifter.search('fieldx:a', {fields: ['fieldx','fieldy','fieldz']});
			assert.equal(result.items.length, 2);
		});

		it('should return one matching row', function() {
			var result = sifter.search('fieldz:b', {fields: ['fieldx','fieldy','fieldz']});
			assert.equal(result.items.length, 1);
		});

		it('should return one matching row', function() {
			var result = sifter.search('fieldz:', {fields: ['fieldx','fieldy','fieldz']});
			assert.equal(result.items.length, 1);
		});

	});

});