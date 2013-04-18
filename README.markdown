Beardy
=====
**Beardy** is a JavaScript templating engine. It is simple, smart and robust.
Beardy is inspired by awesome [Mustache](http://mustache.github.io/) templating engine,
but it differs in some points.

Main design
-----
Beardy follows Mustache logic-less phylosophy,
but brings in some main ideas which differ it from Mustache:
1. There is only three universal constructs: *subst*, *block* and *comment*.
Comment has different closing token then block or subst. It allows to hide blocks and substs in comment.
2. Logic lives in functions, but also *filters* available. Filters modify values and can be chained.
2. No invert block. Instead of it there is special filter `not` that inverts boolean value by JS rules.
3. No special escape or non-escape substs. All substs are **not** escaped by default.
There is special filter `escape` to do it.
4. Closing tag of block does not duplicate block name. It is simpler and allows to avoid nesting errors.
5. Engine respects JS basic rules and follows functional style.

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

**JavaScript**:
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
by basic JS rules, so there is no surprises here.

It is possible to use power of nested objects:

**Template**:
```javascript
'{{ a.b }}'
```

**JavaScript**:
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

**JavaScript**:
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

**JavaScript**:
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

**JavaScript**:
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

**JavaScript**:
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

**JavaScript**:
```javascript
{
}
```

**Output**:
```javascript
'Hey.'
```

Comments can enclose blocks and substs and also span multiple lines.

Advanced Templating
-----
This section will be introduced further. Tests can be used to find out more features.

Licensing
-----
Beardy is available under MIT License terms.
