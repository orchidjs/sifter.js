/*! sifter.js | https://github.com/orchidjs/sifter.js | Apache License (v2) */
'use strict';

var utils = require('./utils.js');
var diacritics = require('./diacritics.js');

/**
 * sifter.js
 * Copyright (c) 2013–2020 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */
class Sifter {
  /**
   * Textually searches arrays and hashes of objects
   * by property (or multiple properties). Designed
   * specifically for autocomplete.
   *
   * @constructor
   * @param {array|object} items
   * @param {object} items
   */
  constructor(items, settings) {
    this.items = void 0;
    this.settings = void 0;
    this.items = items;
    this.settings = settings || {
      diacritics: true
    };
  }

  /**
   * Splits a search string into an array of individual
   * regexps to be used to match results.
   *
   */
  tokenize(query, respect_word_boundaries, weights) {
    if (!query || !query.length) return [];
    var tokens = [];
    var words = query.split(/\s+/);
    var field_regex;

    if (weights) {
      field_regex = new RegExp('^(' + Object.keys(weights).map(utils.escape_regex).join('|') + ')\:(.*)$');
    }

    words.forEach(word => {
      let field_match;
      let field = null;
      let regex = null; // look for "field:query" tokens

      if (field_regex && (field_match = word.match(field_regex))) {
        field = field_match[1];
        word = field_match[2];
      }

      if (word.length > 0) {
        regex = utils.escape_regex(word);

        if (this.settings.diacritics) {
          regex = diacritics.diacriticRegexPoints(regex);
        }

        if (respect_word_boundaries) regex = "\\b" + regex;
        regex = new RegExp(regex, 'i');
      }

      tokens.push({
        string: word,
        regex: regex,
        field: field
      });
    });
    return tokens;
  }

  /**
   * Returns a function to be used to score individual results.
   *
   * Good matches will have a higher score than poor matches.
   * If an item is not a match, 0 will be returned by the function.
   *
   * @returns {function}
   */
  getScoreFunction(query, options) {
    var search = this.prepareSearch(query, options);
    return this._getScoreFunction(search);
  }

  _getScoreFunction(search) {
    const tokens = search.tokens,
          token_count = tokens.length;

    if (!token_count) {
      return function () {
        return 0;
      };
    }

    const fields = search.options.fields,
          weights = search.weights,
          field_count = fields.length,
          getAttrFn = search.getAttrFn;
    /**
     * Calculates the score of an object
     * against the search query.
     *
     * @param {TToken} token
     * @param {object} data
     * @return {number}
     */

    var scoreObject = function () {
      if (!field_count) {
        return function () {
          return 0;
        };
      }

      if (field_count === 1) {
        return function (token, data) {
          const field = fields[0].field;
          return utils.scoreValue(getAttrFn(data, field), token, weights[field]);
        };
      }

      return function (token, data) {
        var sum = 0; // is the token specific to a field?

        if (token.field) {
          const value = getAttrFn(data, token.field);

          if (!token.regex && value) {
            sum += 0.1;
          } else {
            sum += utils.scoreValue(value, token, weights[token.field]);
          }
        } else {
          utils.iterate(weights, (weight, field) => {
            sum += utils.scoreValue(getAttrFn(data, field), token, weight);
          });
        }

        return sum / field_count;
      };
    }();

    if (token_count === 1) {
      return function (data) {
        return scoreObject(tokens[0], data);
      };
    }

    if (search.options.conjunction === 'and') {
      return function (data) {
        var i = 0,
            score,
            sum = 0;

        for (; i < token_count; i++) {
          score = scoreObject(tokens[i], data);
          if (score <= 0) return 0;
          sum += score;
        }

        return sum / token_count;
      };
    } else {
      return function (data) {
        var sum = 0;
        utils.iterate(tokens, token => {
          sum += scoreObject(token, data);
        });
        return sum / token_count;
      };
    }
  }

  /**
   * Returns a function that can be used to compare two
   * results, for sorting purposes. If no sorting should
   * be performed, `null` will be returned.
   *
   * @return function(a,b)
   */
  getSortFunction(query, options) {
    var search = this.prepareSearch(query, options);
    return this._getSortFunction(search);
  }

  _getSortFunction(search) {
    var i, n, self, sort_fld, sort_flds, sort_flds_count, multiplier, multipliers, get_field, implicit_score, sort, options;
    self = this;
    options = search.options;
    sort = !search.query && options.sort_empty || options.sort;
    /**
     * Fetches the specified sort field value
     * from a search result item.
     *
     * @param  {string} name
     * @param  {object} result
     * @return {string}
     */

    get_field = function (name, result) {
      if (name === '$score') return result.score;
      return search.getAttrFn(self.items[result.id], name);
    }; // parse options


    sort_flds = [];

    if (sort) {
      for (i = 0, n = sort.length; i < n; i++) {
        if (search.query || sort[i].field !== '$score') {
          sort_flds.push(sort[i]);
        }
      }
    } // the "$score" field is implied to be the primary
    // sort field, unless it's manually specified


    if (search.query) {
      implicit_score = true;

      for (i = 0, n = sort_flds.length; i < n; i++) {
        if (sort_flds[i].field === '$score') {
          implicit_score = false;
          break;
        }
      }

      if (implicit_score) {
        sort_flds.unshift({
          field: '$score',
          direction: 'desc'
        });
      }
    } else {
      for (i = 0, n = sort_flds.length; i < n; i++) {
        if (sort_flds[i].field === '$score') {
          sort_flds.splice(i, 1);
          break;
        }
      }
    }

    multipliers = [];

    for (i = 0, n = sort_flds.length; i < n; i++) {
      multipliers.push(sort_flds[i].direction === 'desc' ? -1 : 1);
    } // build function


    sort_flds_count = sort_flds.length;

    if (!sort_flds_count) {
      return null;
    } else if (sort_flds_count === 1) {
      sort_fld = sort_flds[0].field;
      multiplier = multipliers[0];
      return function (a, b) {
        return multiplier * utils.cmp(get_field(sort_fld, a), get_field(sort_fld, b));
      };
    } else {
      return function (a, b) {
        var i, result, field;

        for (i = 0; i < sort_flds_count; i++) {
          field = sort_flds[i].field;
          result = multipliers[i] * utils.cmp(get_field(field, a), get_field(field, b));
          if (result) return result;
        }

        return 0;
      };
    }
  }

  /**
   * Parses a search query and returns an object
   * with tokens and fields ready to be populated
   * with results.
   *
   */
  prepareSearch(query, optsUser) {
    const weights = {};
    var options = Object.assign({}, optsUser);
    utils.propToArray(options, 'sort');
    utils.propToArray(options, 'sort_empty'); // convert fields to new format

    if (options.fields) {
      utils.propToArray(options, 'fields');

      if (Array.isArray(options.fields) && typeof options.fields[0] !== 'object') {
        var fields = [];
        options.fields.forEach(fld_name => {
          fields.push({
            field: fld_name
          });
        });
        options.fields = fields;
      }

      options.fields.forEach(field_params => {
        weights[field_params.field] = 'weight' in field_params ? field_params.weight : 1;
      });
    }

    query = diacritics.asciifold(String(query || '')).toLowerCase().trim();
    return {
      options: options,
      query: query,
      tokens: this.tokenize(query, options.respect_word_boundaries, weights),
      total: 0,
      items: [],
      weights: weights,
      getAttrFn: options.nesting ? utils.getAttrNesting : utils.getAttr
    };
  }

  /**
   * Searches through all items and returns a sorted array of matches.
   *
   */
  search(query, options) {
    var self = this,
        score,
        search;
    var fn_sort;
    var fn_score;
    search = this.prepareSearch(query, options);
    options = search.options;
    query = search.query; // generate result scoring function

    fn_score = options.score || self._getScoreFunction(search); // perform search and sort

    if (query.length) {
      utils.iterate(self.items, (item, id) => {
        score = fn_score(item);

        if (options.filter === false || score > 0) {
          search.items.push({
            'score': score,
            'id': id
          });
        }
      });
    } else {
      utils.iterate(self.items, (item, id) => {
        search.items.push({
          'score': 1,
          'id': id
        });
      });
    }

    fn_sort = self._getSortFunction(search);
    if (fn_sort) search.items.sort(fn_sort); // apply limits

    search.total = search.items.length;

    if (typeof options.limit === 'number') {
      search.items = search.items.slice(0, options.limit);
    }

    return search;
  }

}

module.exports = Sifter;
//# sourceMappingURL=sifter.js.map