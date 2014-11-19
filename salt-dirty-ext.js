(function (w) {
  'use strict';

  try {

    // probably the most useful and allows $('#iddiv').find('.inside')
    // $().find()
    w.Element.prototype.find = function find(selector) {
      return $(selector, this); };

    // doing a find in a NodeList doesnt really work. I had a function that
    // would look inside and get the element but it was pretty big and
    // required recusive searching inside NodeLists. So I would suggest just
    // using a '*' selection method
    // $().find()
    w.NodeList.prototype.find = function find(elem) {
      console.error('You cannot find in a NodeList. Just use $(*selector %s)', elem);
      return this; };

    // another useful one for doing $('.inside').each()
    // $().each(function(el){})
    w.NodeList.prototype.each = Array.prototype.forEach;

    // $().attr('prop', 'value') support
    w.Element.prototype.attr = function attr(name, value) {
      if(value) {
        this.setAttribute(name, value);
        return this;
      } else {
        return this.getAttribute(name);
      } };
    w.NodeList.prototype.attr = function attr(name, value) {
      this.each(function(el) {
        if(value) {
          el.setAttribute(name, value);
        } else {
          return el.getAttribute(name);
        }
      }); return this; };

    // $().css('prop', 'value') support
    w.Element.prototype.css = function css(prop, value) {
      if (value) { this.style[prop] = value; return this; }
      else { return this.style[prop]; } };
    w.NodeList.prototype.css = function css(prop, value) {
      this.each(function(el) { el.css(prop, value); }); return this; };

    // $().on('event', function(el){});
    w.Element.prototype.on = function on(eventType, callback) {
      eventType = eventType.split(' ');
      eventType.forEach(function(ev) {
        this.addEventListener(ev, callback);
      }); return this; };
      //for (var i = 0; i < eventType.length; i++) {
      //  this.addEventListener(eventType[i], callback);
      //} return this; };
    w.NodeList.prototype.on = function on(eventType, callback){
      this.each(function(el){
        el.on(eventType, callback);
      }); return this; };

    // $().addClass('name');
    w.NodeList.prototype.addClass = function addClass(name){
      this.each(function(el) {
        el.classList.add(name);
      }); return this; };
    w.Element.prototype.addClass = function addClass(name) {
      this.classList.add(name); return this; };

    // $().removeClass('name');
    w.NodeList.prototype.removeClass = function removeClass(name){
      this.each(function(el) {
        el.classList.remove(name);
      }); return this; };
    w.Element.prototype.removeClass = function removeClass(name) {
      this.classList.remove(name);
      return this; };

    // $().hasClass(name)
    w.Element.prototype.hasClass = function hasClass(name) {
      // contains? how annoying!
      return this.classList.contains(name); };

    // $().first()
    w.NodeList.prototype.first = function first() {
      // if this is more than one item return the first
      return (this.length < 2) ? this : this[0]; };

    // $().last()
    w.NodeList.prototype.last = function last() {
      // if there are many items, return the last
      return (this.length > 1) ? this[this.length - 1] : this; };

  } catch (e) {}

})(window);
