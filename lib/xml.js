const fs = require('fs');
const path = require('path');
const saxes = require('saxes');
const dcutil = require('./util');

exports.parse_file = function(file) {
  return new Promise((resolve, reject) => {
    dcutil.read_file(file)
      .then(text => resolve(parse_text(text)))
      .catch(err => reject(err));
  });
};

exports.parse_text = function(text) {
  return parse_text(text);
};

function parse_text(text) {
  return new Promise((resolve, reject) => {
    var parser = new saxes.SaxesParser();
    var dom = null;
    var current = null;
    var domstack = [ dom ];

    parser.on("error", function (err) {
      reject(err);
    });

    parser.on("text", function (text) {
      if (current) {
        current.append(new XText(text));
      }
    });

    parser.on("opentag", function (node) {
      var element = new XElement(node.name, node.attributes);

      if (current)
        current.withChildren(element);
      else
        dom = element;

      current = element;
      domstack.push(current);
    });

    parser.on("closetag", function (node) {
      domstack.pop();

      if (domstack.length)
        current = domstack[domstack.length - 1];
      else
        current = null;
    });

    parser.on("end", function () {
      resolve(dom);
    });

    parser.write(text).close();
  });
}

// ----------- elements --------------

class XElement {
  constructor(tagName, attrs) {
    this._name = tagName;

    this._attrs = (typeof attrs == 'undefined') ? { } : attrs;
    this._children = [ ];
  }

  set name(v) {
    this._name = v;
  }
  get name() {
    return this._name;
  }

  set attributes(v) {
    this._attrs = v;
  }
  get attributes() {
    return this._attrs;
  }

  // get or set
  attr(name, value) {
    if (typeof value == 'undefined')
      return this._attrs[name];

    this._attrs[name] = value;
    return this;    // to support chaining
  }

  hasAttr(name) {
    return (typeof this._attrs[name] != 'undefined')
  }

  append(...chidren) {
    this.withChildren(chidren);
  }

  withChildren(...chidren) {
    for (var i = 0; i < chidren.length; i++) {
      var child = chidren[i];

      if ((typeof child == 'undefined') || (child == null))
        continue;

      var isdom = false;

      if (typeof child == 'object') {
        var classname = child.constructor.name;

        isdom = ((classname == 'XElement') || (classname == 'XText') || (classname == 'XComment'));
      }

      if (! isdom)
        child = new XText(child.toString());

      this._children.push(child);
    }

    return this;    // to support chaining
  }

  findFirst(name) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];

      if ((typeof child == 'object') && (child.constructor.name == 'XElement') && (child.name == name))
        return child;
    }

    return null;
  }

  findAll(name) {
    var result = [ ];

    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];

      if ((typeof child == 'object') && (child.constructor.name == 'XElement') && (child.name == name))
        result.push(child);
    }

    return result;
  }
}

exports.XElement = XElement;

exports.element = exports.tag = function(tagName, attrs) {
  return new XElement(tagName, attrs);
};

// ----------- text --------------

class XText {
  constructor(text) {
    this._text = text;
  }

  set text(v) {
    this._text = v;
  }
  get text() {
    return this._text;
  }
}

exports.XText = XText;

exports.text = function(text) {
  return new XText(text);
};

// ----------- comments --------------

class XComment {
  constructor(text) {
    this._text = text;
  }

  set text(v) {
    this._text = v;
  }
  get text() {
    return this._text;
  }
}

exports.XComment = XComment;

exports.comment = function(text) {
  return new XComment(text);
};
