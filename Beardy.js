


var Reader = require('./Reader');

function Beardy (template, data)
{
	if (this instanceof Beardy)
	{
		this._struct = analyze(parse(template));
	}
	else
	{
		return new Beardy(template).render(data);
	}
}

Beardy.prototype.render = function (data)
{
	if (Object(data) !== data) throw new TypeError('Need data to render');
	return render.call(this, this._struct, data);
};

Beardy.prototype.filters =
{
	'default'  : function (value, args) { return value ? value : args[0]; },

	not        : function (value) { return  ! value; },
	bool       : function (value) { return !! value; },

	escape     : function (value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&laquo;").replace(/>/g, "&raquo;"); },
	uppercase  : function (value) { return String(value).toUpperCase(); },
	lowercase  : function (value) { return String(value).toLowerCase(); },
	capitalize : function (value) { return String(value).replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); },
	trim       : function (value) { return String(value).trim(); },
	split      : function (value, args) { return String(value).split(args[0] || ','); },

	list       : function (value) { return [].concat(value); },
	join       : function (value, args) { return [].concat(value).join(args[0] || ','); },
	empty      : function (value) { return  ! [].concat(value).length; },

	add        : function (value, args) { return +value + +args[0]; },
	sub        : function (value, args) { return +value - +args[0]; },
	mod        : function (value, args) { return value % args[0]; },
	even       : function (value) { return  ! (value % 2); },
	odd        : function (value) { return !! (value % 2); }
};


function parse (template)
{
	var reader = new Reader(template);
	return parseAll(reader);
}

function parseAll (reader)
{
	var
		r = [],
		rOp;

	while (! reader.end())
	{

		rOp = reader.alternate({
			'comment' : "{#",
			'subst'   : "{{",
			'block'   : "{%",
		}, true);

		r.push(rOp.data);

		switch (rOp.key)
		{
		case 'comment' : parseComment(reader); break;
		case 'subst'   : r.push(parseSubst(reader)); break;
		case 'block'   : r.push(parseBlock(reader)); break;
		}

	}

	return r;
}

function parseComment (reader)
{
	reader.enclose('#}', true);
}

function parseSubst (reader)
{
	var tag = parseTag(reader, '}}');
	return {
		   type : 'subst',
		   name : tag.name,
		filters : tag.filters
	};
}

function parseBlock (reader)
{
	var tag = parseTag(reader, '%}');
	if (tag.name === '.')
	{
		return {
			   type : 'dot'
		};
	}
	else
	{
		return {
			   type : 'block',
			   name : tag.name,
			filters : tag.filters,
			 struct : []
		};
	}
}

function parseTag (reader, encloser)
{
	var rOp, r;

	rOp = reader.alternate({
		'filters' : ":",
		'end'     : encloser
	}, true);

	r = {
		name : rOp.data.trim(),
		filters : []
	};

	if (rOp.key === 'filters')
	{
		r.filters = parseFilters(reader, encloser);
	}

	return r;
}

function parseFilters (reader, encloser)
{
	var r = [], rOp, filter, pOp, pName;
	while (! reader.end())
	{
		rOp = reader.alternate({
			'next'  : ":",
			'param' : "(",
			'end'   : encloser
		}, true);

		filter =
		{
			name : rOp.data.trim(),
			args : []
		}

		if (rOp.key === 'param')
		{
			while (! reader.end())
			{
				pOp = reader.alternate({
					'next': ",",
					'end' : ")"
				}, true);

				pValue = pOp.data;
				if (pValue)
				{
					filter.args.push(pValue);
				}

				if (pOp.key === 'end')
				{
					rOp = reader.alternate({
						'next' : ":",
						'end'  : encloser
					}, true);
					break;
				}
			}
		}

		r.push(filter);

		if (rOp.key === 'end') break;
	}
	return r;
};

function analyze (plain_struct)
{
	var
		struct  = [],
		structs = [ struct ],
		e;

	while (plain_struct.length)
	{
		e = plain_struct.shift();
		if (typeof e === 'string')
		{
			if (e)
			{
				structs[0].push(e);
			}
		}
		else
		{
			switch (e.type)
			{
			case 'block':
				structs[0].push(e);
				structs.unshift(e.struct);
				break;
			case 'dot':
				structs.shift();
				if (! structs.length) throw new SyntaxError('Wrong nesting');
				break;
			default:
				structs[0].push(e);
			}
		}
	}

	return struct;
}

function render (struct, data)
{
	var
		_ = "",
		e,
		item, items,
		subscope,
		key;

	for (var i = 0; i < struct.length; i++)
	{
		e = struct[i];
		if (typeof e === 'string')
		{
			_ += e;
		}
		else
		{
			switch (e.type)
			{
			case 'subst':

				_   += toString(applyFilters.call(this, resolveName(data, e.name), e.filters, e.name, data));

				break;
			case 'block':

				item = applyFilters.call(this, resolveName(data, e.name), e.filters, e.name, data);

				if (item)
				{
					items = [].concat(item);

					for (var j = 0; j < items.length; j++)
					{
						item = items[j];

						subscope = Object.create(data);

						subscope['#']  = j;
						subscope['#0'] = j;
						subscope['#1'] = j + 1;
						subscope['#-'] = j - items.length;

						subscope['#first'] = (j === 0);
						subscope['#last']  = (j === items.length - 1);

						subscope['*'] = item;

						if (Object(item) === item)
						{
							/* shallow copy */
							for (key in item)
							{
								if (Object.prototype.hasOwnProperty.call(item, key))
								{
									subscope[key] = item[key];
								}
							}
						}

						_ += render.call(this, e.struct, subscope);
					}
				}
				break;
			}
		}
	}

	return _;
}

function toString (value)
{
	return value == null ? '' : value + '';
}

function resolveName (data, name)
{
	var
		path  = name.split('.'),
		scope = data,
		value;

	do
	{
		if (typeof scope !== 'object')
		{
			value = null;
			break;
		}

		value = toValue(scope, path[0]);

		scope = value;
		path.shift();
	}
	while (path.length);

	return value;
}

function toValue (data, name)
{
	if (name in data)
	{
		var value;
		if (typeof data[name] === 'function')
		{
			value = data[name].call(data, name);
		}
		else
		{
			value = data[name];
		}
		return value;
	}
	else
	{
		return null;
	}
}

function applyFilters (value, filters, key, data)
{
	for (var i = 0; i < filters.length; i++)
	{
		value = applyFilter.call(this, value, filters[i], key, data);
	}
	return value;
}

function applyFilter (value, filter, key, data)
{
	return this.filters[filter.name].call(this, value, filter.args, key, data);
}

module.exports = Beardy;
