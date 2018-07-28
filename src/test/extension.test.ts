import * as assert from 'assert';
import {
  findPosition,
  getAllStyleName,
  getNearestBeginningQuote,
  getStyleNameAtPoint,
  getStyleNames,
  isInsideString,
  isStyleNameValue
} from '../extension';

suite('Extension Tests', function() {
  test('test getAllStyleName', function() {
    assert.equal(
      'a,b-b,c,d,e',
      getAllStyleName(`.a {}
    .a, .b-b,.c:hover {
        .d {
          font-size: 10.5px;
          background: url(dummy.png);
          background: url(dummy.png );
          background: url('dummy.png');
          background: url( 'dummy.png' );
          background: url(  'dummy.png'  );
          background: url("dummy.png");
          background: url( "dummy.png" );
          background: url(  "dummy.png"  );
          background: url(dummy.sub.png);
          background: url('dummy.sub.png');
          background: url("dummy.sub.png");
        }
    }
    .e
      font-size: 10.5px
      `)
        .map(a => a.styleName)
        .join(',')
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

  test('test getStyleNameAtPoint', function() {
    assert.equal('foo', getStyleNameAtPoint('foo bar piyo-piyo', 0));
    assert.equal('foo', getStyleNameAtPoint('foo bar piyo-piyo', 1));
    assert.equal('foo', getStyleNameAtPoint('foo bar piyo-piyo', 2));
    assert.equal('foo', getStyleNameAtPoint('foo bar piyo-piyo', 3));
    assert.equal('bar', getStyleNameAtPoint('foo bar piyo-piyo', 4));
    assert.equal('bar', getStyleNameAtPoint('foo bar piyo-piyo', 5));
    assert.equal('bar', getStyleNameAtPoint('foo bar piyo-piyo', 6));
    assert.equal('bar', getStyleNameAtPoint('foo bar piyo-piyo', 7));
    assert.equal('piyo-piyo', getStyleNameAtPoint('foo bar piyo-piyo', 8));
  });

  test('test getStyleNames', function() {
    assert.equal('foo,bar,piyo-piyo,test', getStyleNames('=`foo bar piyo-piyo ${"test"}`').join(','));
  });

  test('test findPosition', function() {
    const code = `foo bar
piyo test`;
    const pos0 = findPosition(code, 'foo');
    const pos1 = findPosition(code, 'bar');
    const pos2 = findPosition(code, 'piyo');
    const pos3 = findPosition(code, 'test');
    const pos4 = findPosition(code, 'fuga');
    assert.equal(0, pos0.line);
    assert.equal(0, pos0.character);
    assert.equal(0, pos1.line);
    assert.equal(4, pos1.character);
    assert.equal(1, pos2.line);
    assert.equal(0, pos2.character);
    assert.equal(1, pos3.line);
    assert.equal(5, pos3.character);
    assert.equal(0, pos4.line);
    assert.equal(0, pos4.character);
  });
});
