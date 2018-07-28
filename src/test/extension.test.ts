import * as assert from 'assert';
import { getAllStyleName, getNearestBeginningQuote, isInsideString, isStyleNameValue } from '../extension';

suite('Extension Tests', function() {
  test('test getAllStyleName', function() {
    assert.equal(
      'a,b,c,d',
      getAllStyleName(`.a {}
    .a, .b,.c:hover {
        .d {
          font-size: 10.5px;
          background: url(dummy.png);
          background: url('dummy.png');
          background: url("dummy.png");
          background: url(dummy.sub.png);
          background: url('dummy.sub.png');
          background: url("dummy.sub.png");
        }
    }`).join()
    );
  });

  test('test isStyleNameValue', function() {
    assert.equal(true, isStyleNameValue('<div id="val" styleName="foo'));
    assert.equal(true, isStyleNameValue('<div styleName="foo'));
    assert.equal(true, isStyleNameValue(`<div styleName='foo`));
    assert.equal(true, isStyleNameValue('<div styleName=`foo${" bar'));
    assert.equal(false, isStyleNameValue('<div className="foo'));
    assert.equal(false, isStyleNameValue(`<div className='foo`));
    assert.equal(false, isStyleNameValue('<div className=`foo${" bar'));
  });

  test('test getNearestBeginningQuote', function() {
    assert.equal('"', getNearestBeginningQuote('<div id="val" styleName="foo'));
    assert.equal('"', getNearestBeginningQuote('<div styleName="foo'));
    assert.equal("'", getNearestBeginningQuote(`<div styleName='foo`));
    assert.equal('"', getNearestBeginningQuote('<div styleName=`foo${" bar'));
    assert.equal('`', getNearestBeginningQuote('<div styleName=`foo'));
    assert.equal(null, getNearestBeginningQuote('<div styleName='));
  });

  test('test isInsideString', function() {
    assert.equal(true, isInsideString('<div styleName="foo'));
    assert.equal(true, isInsideString(`<div styleName='foo`));
    assert.equal(true, isInsideString('<div styleName=`foo'));
    assert.equal(false, isInsideString('<div styleName="foo"'));
    assert.equal(false, isInsideString(`<div styleName='foo'`));
    assert.equal(false, isInsideString('<div styleName=`foo`'));
    assert.equal(true, isInsideString('<div styleName=`foo${"bar'));
    assert.equal(false, isInsideString('<div styleName=`foo${"bar"'));
    assert.equal(true, isInsideString('<div styleName=`foo${"bar"+\'piyo'));
    assert.equal(false, isInsideString('<div styleName=`foo${"bar"+\'piyo\''));
    assert.equal(true, isInsideString('<div styleName="foo', '"'));
    assert.equal(false, isInsideString("<div id='1' styleName=\"foo", "'"));
  });
});
