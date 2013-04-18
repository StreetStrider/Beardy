


function Reader (source)
{
	this._source = source ? "" + source : "";
	this._length = this._source.length;
	this._c = 0;
}

Reader.End = function () {};
Reader.End.prototype = Object.create(Error.prototype);

Reader.prototype.end = function ()
{
	return this._c == this._length;
};

Reader.prototype.notEnd = function () /* throws */
{
	if (this.end()) throw new Reader.End();
};

Reader.prototype.next = function () /* throws */
{
	this.notEnd();
	this._c++;
};

Reader.prototype.move = function (count)
{
	while (count-- && ! this.end())
	{
		this.next();
	}
};

Reader.prototype.symf = function () /* throws */
{
	this.notEnd();
	return this._source.charAt(this._c);
};

Reader.prototype.sym = function () /* throws */
{
	try
	{
		return this.symf();
	}
	finally
	{
		this.next();
	}
};

Reader.prototype.symfch = function (chars) /* throws */
{
	return chars.indexOf(this.symf()) != -1;
};

Reader.prototype.word = function (terminators, wind)
{
	var r = '';
	while (! this.end())
	{
		if (this.symfch(terminators)) break;
		r += this.sym();
	}
	if (wind)
	{
		this.move(1);
	}
	return r;
};

Reader.prototype._spaceCharacter = /^\s$/;

Reader.prototype.skip = function ()
{
	while (! this.end())
	{
		if (! this._spaceCharacter.test(this.symf())) break;
		this.next();
	}
};

Reader.prototype.wordsp = function (skip)
{
	var r = '';
	while (! this.end())
	{
		if (this._spaceCharacter.test(this.symf())) break;
		r += this.sym();
	}
	if (skip)
	{
		this.skip();
	}
	return r;
};

Reader.prototype.rest = function ()
{// fast rest
	return this._source.substr(this._c);
};

Reader.prototype.forward = function (func)
{
	var pos = this._c;
	try
	{
		return func.call(this);
	}
	finally
	{
		this._c = pos;
	}
};

Reader.prototype._forward = function (name)
{
	return function () {
		var pos = this._c;
		try
		{
			return this[name].apply(this, arguments);
		}
		finally
		{
			this._c = pos;
		}
	};
};

Reader.prototype.wordf = Reader.prototype._forward('word');

Reader.prototype.stripe = function (length)
{
	var r = '';
	while (! this.end() && length--)
	{
		r += this.sym();
	}
	return r;
};

Reader.prototype.stripef = Reader.prototype._forward('stripe');

Reader.prototype.match = function (phrase)
{
	return this.stripef(phrase.length) == phrase;
};

Reader.prototype.enclose = function (encloser, wind)
{
	var r = '';
	while (! this.end())
	{
		if (this.match(encloser)) break;
		r += this.sym();
	}
	if (wind)
	{
		this.move(encloser.length);
	}
	return r;
};

Reader.prototype.enclosef = Reader.prototype._forward('enclose');

Reader.prototype.choice = function (choices)
{
	for (var key in choices)
	{
		if (this.match(choices[key])) return key;
	}
	return null;
};

Reader.prototype.alternate = function (choices, wind)
{
	var r = "", key = null;
	while (! this.end())
	{
		key = this.choice(choices);
		if (key) break;
		r += this.sym();
	}
	if (wind && key !== null)
	{
		this.move(choices[key].length);
	}
	return {
		key  : key,
		data : r
	};
};

Reader.prototype.alternatef = Reader.prototype._forward('alternate');

module.exports = Reader;
