import loadButtonTraits from './buttonTraits.js';
import loadFlexTraits from './flexTraits.js';
import loadFontTraits from './fontTraits.js';
import loadHeaderTraits from './headerTraits.js';
import loadImageTraits from './imageTraits.js';
import loadLayoutTraits from './layoutTraits.js';
import loadListItemTraits from './listItemTraits.js';
import loadReactInputTraits from './reactInputTraits.js';
import loadSpacingTraits from './spacingTraits.js';

export default (editor) => {
  loadButtonTraits(editor);
  loadFlexTraits(editor);
  loadFontTraits(editor);
  loadHeaderTraits(editor);
  loadImageTraits(editor);
  loadLayoutTraits(editor);
  loadListItemTraits(editor);
  loadReactInputTraits(editor);
  loadSpacingTraits(editor);
};
