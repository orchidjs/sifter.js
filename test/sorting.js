var assert = require('assert');
var {Sifter} = require('@orchidjs/sifter');

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
			fields: ['fields.nested'],
			sort: {field: 'fields.nested'},
			nesting: true
		});
		assert.equal(result.items[0].id, 0);
		assert.equal(result.items[1].id, 2);
		assert.equal(result.items[2].id, 1);
	});

	it('should not order results by $score (use original order)', function() {

		var data = [
			{fielda:'aaab',$order:1},
			{fielda:'babaaa',$order:2},
			{fielda:'abaaaaa',$order:10},
			{fielda:'aabaaaaaaa',$order:12},
			{fielda:'abbaaaaa',$order:20},
			{fielda:'abaaaaaaa',$order:22},
		];

		var sifter = new Sifter(data);
		var search = sifter.search('a', {
			fields: [{field: 'fielda'}],
			sort: [{field: '$order'},{field:'$score'}],
		});


		assert.equal(search.items[0].id,0);
		assert.equal(search.items[1].id,1);
		assert.equal(search.items[2].id,2);
		assert.equal(search.items[3].id,3);
		assert.equal(search.items[4].id,4);
		assert.equal(search.items[5].id,5);
	});

	it('user defined sort function', function() {

		var data = [
			{fielda:'af'},
			{fielda:'ad'},
			{fielda:'aa'},
			{fielda:'ac'},
			{fielda:'ae'},
			{fielda:'ab'},
		];

		var sifter = new Sifter(data);
		var search = sifter.search('a', {
			fields: [{field: 'fielda'}],
			sort: function(a,b){
				var item_a = this.items[a.id];
				var item_b = this.items[b.id];
				return item_a.fielda.localeCompare(item_b.fielda);
			},
		});

		assert.equal(search.items[0].id,2); // aa
		assert.equal(search.items[1].id,5); // ab
		assert.equal(search.items[2].id,3); // ac
		assert.equal(search.items[3].id,1); // ad
		assert.equal(search.items[4].id,4); // ae
		assert.equal(search.items[5].id,0); // af
	});

});
