import {expandTag} from '../../src/util/expand-tag';

test('expand tag single', () => {
  const tag = '#tag';
  const expected = ['tag'];
  const actual = expandTag(tag);
  expect(actual).toEqual(expected);
});

test('expand tag multiple', () => {
  const tag = '#tag1/tag2/tag3';
  const expected = ['tag1', 'tag1/tag2', 'tag1/tag2/tag3'];
  const actual = expandTag(tag);
  expect(actual).toEqual(expected);
});

test('expand tag special chars', () => {
  const tag = '#tag1/tag_2/tag-3';
  const expected = ['tag1', 'tag1/tag_2', 'tag1/tag_2/tag-3'];
  const actual = expandTag(tag);
  expect(actual).toEqual(expected);
});