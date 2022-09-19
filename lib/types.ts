
import Sifter from './sifter';

export type Field = {
	field: string,
	weight: number,
}

export type Sort = {
	field: string,
	direction?: string,
}

export type SortFn = (this:Sifter, a:ResultItem, b:ResultItem)=>number;

export type Options = {
 	fields: Field[],
 	score: ()=>any,
 	filter: boolean,
 	limit: number,
	sort: SortFn|Sort[],
 	sort_empty: SortFn|Sort[],
 	nesting: boolean,
	respect_word_boundaries: boolean,
	conjunction: string,
}

export type Token = {
	string:string,
	regex:RegExp|null,
	field:string|null,
}

export type Weights = {[key:string]:number}

export type PrepareObj = {
	options: Options,
	query: string,
	tokens: Token[],
	total: number,
	items: ResultItem[],
	weights: Weights,
	getAttrFn: (data:any,field:string)=>any,

}

export type Settings = {
	diacritics:boolean
}

export type ResultItem = {
	score: number,
	id: number|string,
}
