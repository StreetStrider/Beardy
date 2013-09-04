Beardy
=====
**Beardy** is a JavaScript templating engine. It is simple, smart and robust.
Beardy is inspired by awesome [Mustache](http://mustache.github.io/) templating engine,
but it differs in some points.

Beardy now is in release-candidate state. Some things change in future, basics are stable.
Inlay mechanism still in development, so it's volatile.

Beardy is fully tested. You can run tests by calling `tests/run` in project tree. Submodule must
be loaded.

Main design
-----
Beardy follows Mustache logic-less phylosophy,
but brings in some main ideas which differ it from Mustache:

1. There is only three universal constructs: *subst*, *block* and *comment*.
Comment has different closing token then block or subst. It allows to hide blocks and substs in comment.
2. Logic lives in functions, but also *filters* available. Filters modify values and can be chained.
3. No invert block. Instead of it there is special filter `not` that inverts boolean value by JS rules.
4. No special escape or non-escape substs. All substs are **not** escaped by default.
There is special filter `escape` to do it.
5. Closing tag of block does not duplicate block name. It is simpler and allows to avoid nesting errors.
6. Engine respects JS basic rules and follows functional style.

Syntax basics
-----
Engine takes template string and data object and returns rendered string.
Template can contain special control sequences: **subst** and **block**. It also can contain commentaries,
that can also shadow subst and block in it.

### Subst
Subst is a structure for outputting values from data object. It substs (substitutes) value by certain key.

**Template**:
```javascript
'{{ a }}'
```

**Data Object**:
```javascript
{
  a: 1
}
```

**Output**:
```
'1'
```
This searches value in data object by key and outputs it. Number will be casted to string.
The basic rule are simple: `null` and `undefined` results in empty string, all other values are casted
by basic JS rules, so there is no surprises here. If engine meets function as a value it executes it
in context of object that owns it, and uses its result as a value.

It is possible to use power of nested objects:

**Template**:
```javascript
'{{ a.b }}'
```

**Data Object**:
```javascript
{
  a:
  {
    b: 1
  }
}
```

**Output**:
```javascript
'1'
```

Dot notation works just as in JS. There is two main points:

1. If there is too much levels (for instance `a.b` in template and `b` is also an subobject)
it results in object outputting by JS rules (calling `.toString`).
2. If object has not enough levels to walk in (for instance `a.b.c` in template and no `c` subobject)
it results in empty string. This is just because `undefined` results in empty string.

Filters are available, and they can be chained good:

**Template**:
```javascript
'{{ a:trim:capitalize }}'
```

**Data Object**:
```javascript
{
  a: ' le spy '
}
```

**Output**:
```javascript
'Le Spy'
```

More about filters in next sections.

### Block
Block is a control structure. It has name (key) and content. It can output value zero, one or many times,
depends on its key value.

**Template**:
```javascript
'{% a %}1{% . %}'
```

**Data Object**:
```javascript
{
  a: false
}
```

**Output**:
```javascript
''
```

If value casts to `false` by JS rules the block content would not be outputted.
If value casts to `true` the block content would be outputted once.
If value is also an list, the block content would be outputted once for each element of list.

More examples:

**Template**:
```javascript
'{% a %}1{% . %}'
```

**Data Object**:
```javascript
{
  a: 'some true value'
}
```

**Output**:
```javascript
'1'
```

In case of list block registrates special ``*`` key in it to access current iterable element.

**Template**:
```javascript
'{% a %}{{ * }}{% . %}'
```

**Data Object**:
```javascript
{
  a: [1, 2, 3]
}
```

**Output**:
```javascript
'123'
```

### Comment
Comments are sequences that are marked to be not outputted at any case.

**Template**:
```javascript
'{# This is a comment. #}Hey.'
```

**Data Object**:
```javascript
{
}
```

**Output**:
```javascript
'Hey.'
```

Comments can enclose blocks and substs and also span multiple lines.

### Functions
Functions can be used in mix with usual values and supplied in data object. Functions acts like properties,
when value contains function, is executes and its result is used as value for subst or block.

Function always executes in context of object that owns it. If function is on the top level of
data object it will be executed in context of data object. If function is in subobject it will
be executed in that subobject context. It allows to use local keys in function.

In addition function supplied by single argument that contain key with which it was invoked.

**Template**:
```javascript
'{{ fn }}'
```

**Data Object**:
```javascript
{
  a: 'basis_',
  fn: function (key) { return this.a + key; }
}
```

**Output**:
```javascript
'basis_fn'
```

Advanced Templating
-----
This section will be introduced further. Tests can be used to find out more features.

Environments
-----
Beardy is a templating engine of general purpose. It's good for any string-data templating needs.
Beardy works first in Node.js and also can be builded for Web by using `build/build-web.js` script.

Licensing
-----
Beardy is available under MIT License terms.
