var assert = require('assert');
var sifter = require('../dist/cjs/sifter.js');

describe('#prepareSearch()', function() {

	it('should remove accents', function() {

		var from	= 'aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ';
		var to		= 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

		assert.strictEqual( sifter.cmp(from,to), 0 );
	});

	it('getAttr should return void when invalid object passed', function() {
		assert.equal( sifter.getAttr(null,'test'), null);
	});

	it('getAttrNesting should return void when invalid object passed', function() {
		assert.equal( sifter.getAttrNesting(null,'test'), null);
	});

	it('scoreValue should cast non-string values to string', function() {
		var token = {string:'a',regex:new RegExp('a','i')};
		var score = sifter.scoreValue([], token, 1);
		assert.equal( score, 0);
	});

});
