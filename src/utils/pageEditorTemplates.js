export const headerTemplate = {
  html: `<header class="header-container"><div class="header-brand"><h1>My Brand</h1></div><SignInButton target="current" buttonType="primary"></SignInButton></header>`,
  css: `* { box-sizing: border-box; } body {margin: 0;}.header-brand{flex-grow:1;flex-shrink:1;flex-basis:auto;padding-top:8px;padding-right:8px;padding-bottom:8px;padding-left:8px;}.header-brand h1{font-size:20px;font-weight:500;}.header-brand img{max-height:48px;}.header-container{display:flex;flex-grow:0;flex-shrink:1;flex-basis:auto;flex-wrap:nowrap;column-gap:12px;width:100%;margin-top:0px;margin-right:0px;margin-bottom:0px;margin-left:0px;padding-top:12px;padding-right:12px;padding-bottom:12px;padding-left:12px;height:64px;align-items:center;}`,
  components: `[{"type":"navbar-header","classes":["header-container"],"attributes":{},"components":[{"type":"header-brand","classes":["header-brand"],"attributes":{},"components":[{"tagName":"h1","type":"text","name":"My Brand","removable":false,"draggable":false,"badgable":false,"highlightable":false,"copyable":false,"hoverable":false,"content":"My Brand"}]},{"type":"SignInButton","attributes":{"target":"current","buttonType":"primary"}}]}]`,
  styles: `[{"selectors":["header-brand"],"style":{"flex-grow":"1","flex-shrink":"1","flex-basis":"auto","padding-top":"8px","padding-right":"8px","padding-bottom":"8px","padding-left":"8px"},"group":"cmp:header-brand"},{"selectors":[],"selectorsAdd":".header-brand h1","style":{"font-size":"20px","font-weight":"500"},"group":"cmp:header-brand"},{"selectors":[],"selectorsAdd":".header-brand img","style":{"max-height":"48px"},"group":"cmp:header-brand"},{"selectors":["header-container"],"style":{"display":"flex","flex-grow":"0","flex-shrink":"1","flex-basis":"auto","flex-wrap":"nowrap","column-gap":"12px","width":"100%","margin-top":"0px","margin-right":"0px","margin-bottom":"0px","margin-left":"0px","padding-top":"12px","padding-right":"12px","padding-bottom":"12px","padding-left":"12px","height":"64px","align-items":"center"},"group":"cmp:navbar-header"}]`,
};

export const footerTemplate = {
  html: `<footer><h5 class="footer-text">© 2021 Passion.do | All rights reserved</h5></footer>`,
  css: `* { box-sizing: border-box; } body {margin: 0;}.footer-text{text-align:center;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px;font-weight:500;font-size:16px;}`,
  components: `[{"type":"site-footer","components":[{"tagName":"h5","content":"© 2021 Passion.do | All rights reserved","styles":".footer-text {text-align: center;padding: 20px;font-weight: 500;font-size: 16px;}","classes":["footer-text"]}]}]`,
  styles: `[{"selectors":["footer-text"],"style":{"text-align":"center","padding-top":"20px","padding-right":"20px","padding-bottom":"20px","padding-left":"20px","font-weight":"500","font-size":"16px"},"group":"cmp:"}]`,
};

export const blankPageTemplate = {
  external_id: 'blank',
  name: 'Blank Template',
  description: 'An empty template if you want to start out fresh',
  thumbnail_url: 'none',
  content: {
    components: `[{"name":"Row","droppable":".cell","resizable":{"tl":0,"tc":0,"tr":0,"cl":0,"cr":0,"bl":0,"br":0,"minDim":1},"classes":[{"name":"row","private":1}],"components":[{"name":"Cell","draggable":".row","stylable-require":["flex-basis"],"unstylable":["width"],"resizable":{"tl":0,"tc":0,"tr":0,"cl":0,"cr":1,"bl":0,"br":0,"minDim":1,"bc":0,"currentUnit":1,"step":0.2,"keyWidth":"flex-basis"},"classes":[{"name":"cell","private":1}],"components":[{"tagName":"section","classes":["bdg-sect"],"components":[{"tagName":"h1","type":"text","classes":["heading"],"components":[{"type":"textnode","removable":false,"draggable":false,"highlightable":0,"copyable":false,"selectable":true,"content":"Blank Template","_innertext":false}]},{"tagName":"p","type":"text","classes":["paragraph"],"components":[{"type":"textnode","content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"}]}]}]}]}]`,
    styles: `[{"selectors":[{"name":"row","private":1}],"style":{"display":"flex","justify-content":"flex-start","align-items":"stretch","flex-wrap":"nowrap","padding-top":"10px","padding-right":"10px","padding-bottom":"10px","padding-left":"10px"}},{"selectors":[{"name":"row","private":1}],"style":{"flex-wrap":"wrap"},"mediaText":"(max-width: 768px)","atRuleType":"media"},{"selectors":[{"name":"cell","private":1}],"style":{"min-height":"75px","flex-grow":"1","flex-basis":"100%"}}]`,
    html: `<div class="row"><div class="cell"><section class="bdg-sect"><h1 class="heading">Blank Template</h1><p class="paragraph">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p></section></div></div>`,
    css: `* { box-sizing: border-box; } body {margin: 0;}.row{display:flex;justify-content:flex-start;align-items:stretch;flex-wrap:nowrap;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;}.cell{min-height:75px;flex-grow:1;flex-basis:100%;}@media (max-width: 768px){.row{flex-wrap:wrap;}}`,
  },
};
