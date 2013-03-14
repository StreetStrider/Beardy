


var Beardy = require('./Beardy');

var SIMPLE_TEMPLATE = 'abc def - zxc asqwezc { } [ ] ! # . $ *';

module.exports = [

	{ name: 'Instantiating', code: function () {
		var b = new Beardy;
		return b instanceof Beardy;
	}},

	{ name: 'Render without data', code: function () {
		var b = new Beardy;
		var thr = false;

		try
		{
			b.render();
		}
		catch (e)
		{
			thr = (e instanceof TypeError && e.message === 'Need data to render');
		}

		return thr;
	}},

	{ name: 'Render undefined template', code: function () {
		var b = new Beardy;
		var r = b.render({});
		return r === '';
	}},

	{ name: 'Render empty template', code: function () {
		var b = new Beardy('');
		var r = b.render({});
		return r === '';
	}},

	{ name: 'Render simple string', code: function () {
		var b = new Beardy(SIMPLE_TEMPLATE);
		var r = b.render({});
		return r === SIMPLE_TEMPLATE;
	}},

	{ name: 'In-place rendering', code: function () {
		return Beardy(SIMPLE_TEMPLATE, {1:1}) === SIMPLE_TEMPLATE;
	}},

	{ name: 'Commentary', code: function () {
		return (
		    Beardy('{# asd qwe zxc #}', {}) === ''
		 && Beardy('asd{# qwe #}zxc', {}) === 'asdzxc'
		 && Beardy('asd{# {} { # } {{ }} \n \n \t {% %} #}zxc', {}) === 'asdzxc'
		);
	}},

	{ name: 'Simple substs', code: function () {
		return Beardy('{{ a }}-{{ b }}-{{ 15 }}{# -{{ d }} #}', { a: 5, b: 7, '15': 10, d: 'abc' }) === '5-7-10';
	}},

	/*
		undefined and null means empty string,
		empty list uses toString strategy, so it means empty string as well
	 */
	{ name: 'Type coercion of empty objects', code: function () {
		return Beardy('{{ A }}{{ B }}{{ C }}{{ D }}', { A: undefined, B: null, C: '', D: [] }) === '';
	}},

	/*
		as common, toString strategy is used,
		this is mostly similar to JS native behavior
	 */
	{ name: 'Type coercion of non empty primitives and objects', code: function () {
		return Beardy('{{OBJECT}},{{TRUE}},{{FALSE}},{{NUMBER}},{{ARRAY}},{{INF}},{{NAN}}', {
			OBJECT : {},
			TRUE   : true,
			FALSE  : false,
			NUMBER : 7,
			ARRAY  : [1,2,3],
			INF    : 1/0,
			NAN    : 1 * 'a'
		}) === '[object Object],true,false,7,1,2,3,Infinity,NaN';
	}},

	/*
		outer space trimmed,
		inner spaces saved
	 */
	{ name: 'Space in substs', code: function () {
		return Beardy('{{   a b  c    }}', { 'a b  c': true }) === 'true';
	}},

	/*
		Function takes one special arguments: name of subst it used as
	 */
	{ name: 'Function values in substs', code: function () {
		return (
		    Beardy('{{ fn }}', { x: 5, fn: function () { return this.x * this.x; } }) === '25'
		 && Beardy('{{ fn }}', { x: 5, fn: function () { return '3' + this.x; } }) === '35'
		 && Beardy('{{ fn }}', { x: 5, fn: function (name) { return name; } }) === 'fn'
		);
	}},

	{ name: 'Simple blocks', code: function () {
		return Beardy(
			'<{% x %}1{% . %}><{% y %}2{% . %}><{% z %}3{% . %}>',
			{ x:null, y:'5', z:[1,2,3]})
			=== '<><2><333>';
	}},

	{ name: 'Falsy blocks', code: function () {
		return (
		    Beardy('{% B %}Block{% . %}', {}) === ''
		 && Beardy('{% B %}Block{% . %}', {1: 1}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: undefined}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: null}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: false}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: ''}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: 0}) === ''
		 && Beardy('{% B %}Block{% . %}', {B: []}) === ''
		);
	}},

	{ name: 'Single-run blocks', code: function () {
		return (
		    Beardy('{% B %}Block{% . %}', {B: 1}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: true}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: ' '}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: {}}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: [1]}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: [true]}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: [' ']}) === 'Block'
		 && Beardy('{% B %}Block{% . %}', {B: [{}]}) === 'Block'
		);
	}},

	{ name: 'Function values in blocks', code: function () {
		return (
		    Beardy('{% B %}B_{% . %}', {x: 'a,b,c', B: function () { return; } }) === ''
		 && Beardy('{% B %}B_{% . %}', {x: 'a,b,c', B: Array }) === 'B_'
		 && Beardy('{% B %}B_{% . %}', {x: 'a,b,c', B: function () { return this.x; } }) === 'B_'
		 && Beardy('{% B %}B_{% . %}', {x: 'a,b,c', B: function () { return this.x.split(','); } }) === 'B_B_B_'
		);
	}},

	/*
		{{ * }}      - item
		{{ # }}      - 0-based index     (0, 1, 2, ..., L-2, L-1)
		{{ #0 }}     - 0-based index
		{{ #1 }}     - 1-based index    (1, 2, 3, ..., L-1, L)
		{{ #- }}     - negative 1-based index from end (-L, 1-L, 2-L, ..., -2, -1)
		{{ #first }} - first element (bool)
		{{ #last }}  - last element (bool)
	 */
	{ name: 'Block context special keys', code: function () {
		return Beardy(
			'[{% B %}<{{ #first }}={{ * }}={{ # }}={{ #0 }}={{ #1 }}={{ #- }}={{ #last }}>{% . %}]',
			{ B: ['a', 'b', 'c', 'd'] })
			=== '[<true=a=0=0=1=-4=false><false=b=1=1=2=-3=false><false=c=2=2=3=-2=false><false=d=3=3=4=-1=true>]';
	}},

	{ name: 'Block context key extending', code: function () {
		function mul () { return this.b * this['#-']; }
		return Beardy(
			'[{% B %}<{{ a }}={{ b }}={{ c }}={{ # }}>{% . %}]',
			{ B: [
				{ a: 2, b: 2, c: mul },
				{ a: 3, b: 2, c: mul },
				{ a: 4, b: 2, c: mul },
			] })
			=== '[<2=2=-6=0><3=2=-4=1><4=2=-2=2>]';
	}},

	{ name: 'Block context parenting', code: function () {
		return Beardy(
			'{{ X }}-{{ Y }}{% B %}:{{ X }}-{{ Y }}-{{ fn }}{% . %}',
			{
				X: 3,
				B: [
					{ Y: 3 },
					{ X: 4, Y: 5 }
				],
				fn: function () { return this.X; }
			})
			=== '3-:3-3-3:4-5-4';
	}},

	{ name: 'Block context key overriding', code: function () {
		return Beardy(
			'{% B %}{{ * }}-{{ # }}-{{ #last }}{% . %}',
			{
				B:
				[
					{ '*': 1, '#': 2, '#last': function () { return 3; } }
				]
			})
			=== '1-2-3';
	}},

	{ name: 'Nested blocks-lists', code: function () {
		return Beardy(
			'{% B %}{% * %}{{ * }}, {% . %};{% . %}',
			{ B: [[], [1], [1,2,3]] })
			=== ';1, ;1, 2, 3, ;';
	}},

	{ name: 'Nested blocks-structs', code: function () {
		return Beardy(
			'{% B %}{% A %}{{ * }}, {% . %};{% . %}',
			{ B: [{A:[1]}, {A:[2,3]}, {A:[4,5,6]}] })
			=== '1, ;2, 3, ;4, 5, 6, ;';
	}},

	{ name: 'Nested blocks-functions', code: function () {
		function stub () { return [1,2,3]; }
		function val () { return this.x; }
		return Beardy(
			'{% B %}{% * %}{{ * }}, {% . %};{% . %}',
			{ B: [stub, {x:[4,5], '*': val}, [6,7,8]] })
			=== '1, 2, 3, ;4, 5, ;6, 7, 8, ;';
	}},

	{ name: 'Nested blocks parenting', code: function () {
		function val () { return '' + this.A + this.B; }
		return Beardy('{{ A }}{{ B }}{{ C }},{% B1 %}'+
			'{{ A }}{{ B }}{{ C }},'+
			'{% B2 %}{{ A }}{{ B }}{{ C }},'+
			'{% B3 %}{{ A }}{{ B }}{{ C }}{% . %}{% . %}{% . %}',
			{
				A: 3,
				B1:
				{
					B: 4,
					B2:
					{
						C: val,
						B3: {}
					}
				}
			}) === '3,34,3434,3434';
	}},

	{ name: 'Nested blocks overriding', code: function () {
		function val () { return '' + this.A + this.B; }
		function no () { return ''; }
		return Beardy('{{ A }}{{ B }}{{ C }},{% B1 %}'+
			'{{ A }}{{ B }}{{ C }},'+
			'{% B2 %}{{ A }}{{ B }}{{ C }},'+
			'{% B3 %}{{ A }}{{ B }}{{ C }}{% . %}{% . %}{% . %}',
			{
				A: 3,
				B1:
				{
					A: 5,
					B: 4,
					B2:
					{
						A: 6,
						B: 5,
						C: val,
						B3:
						{
							A: 7,
							B: 6,
							C: no
						}
					}
				}
			}) === '3,54,6565,76';
	}},

	{ name: 'Dot access', code: function () {
		return Beardy('{{ A.B.C }},{{ B.1.0 }},{{ C.D.E }}',
			{
				A: { B: { C: 'a' }},
				B: [ 0, [ 'b' ] ],
				C: function () { return { D: function () { return { E: function () { return 'c' }, E1: 1 }; } }; }
			}) === 'a,b,c';
	}},

	{ name: 'Dot access shorting', code: function () {
		return Beardy('{{ A.B.C }}-{% A %}{{ B.C }}-{% B %}{{ C }}-{% C %}{{ * }}{% . %}{% . %}{% . %}',
			{ A: { B: { C: 5 } } }) === '5-5-5-5';
	}},

	{ name: 'Filter signature', code: function () {
		var b = new Beardy('{{ X:F(1,2,3) }}');
		var d = { X: 1 };

		b.filters =
		{
			F: function (value, args, key, data) { return '' +
				(this === b) + ';' +
				value + ';' +
				args + ';' +
				key + ';' +
				(data === d); }
		};
		var x = b.render(d);
		return x === 'true;1;1,2,3;X;true';
	}},

	{ name: 'Filter:default', code: function () {
		return Beardy('{{ X:default(1) }},{{ Y:default(2) }}', { X: 3 }) === '3,2';
	}},

	{ name: 'Filter:not', code: function () {
		return Beardy('{% C %}{{ A:not }},{% . %}',
		{
			C:
			[
				{},
				{ A: true },
				{ A: false },
				{ A: 1 },
				{ A: 0 },
				{ A: {} },
				{ A: [] },
				{ A: [1] },
			]
		}) === 'true,false,true,false,true,false,false,false,';
	}},

	{ name: 'Filter:bool', code: function () {
		return Beardy('{% C %}{{ A:bool }},{% . %}',
		{
			C:
			[
				{},
				{ A: true },
				{ A: false },
				{ A: 1 },
				{ A: 0 },
				{ A: {} },
				{ A: [] },
				{ A: [1] },
			]
		}) === 'false,true,false,true,false,true,true,true,';
	}},

	{ name: 'Filter:empty', code: function () {
		return Beardy('{{ A:empty }},{{ B:empty }},{{ C:empty }},{{ D:empty }}',
		{
			A: true,
			B: 1,
			C: [1],
			D: []
		}) === 'false,false,false,true';
	}},

	//{ name: 'Filter:', code: function () {

];
