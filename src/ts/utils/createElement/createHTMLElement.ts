/**
 * @property {Function} createHTMLElement - create DOM HTML Elements with given params
 */
export const createHTMLElement = <TagName extends keyof HTMLElementTagNameMap>(
 params: CreateHTMLElementParams<TagName>
): HTMLElementTagNameMap[TagName] => {
 const element = document.createElement<TagName>(params.elementName);

 if (params.id) {
  element.id = params.id;
 }

 if (params.className) {
  element.className = params.className;
 }

 if (params.content) {
  element.innerHTML = params.content;
 }

 if (params.text) {
  element.textContent = params.text;
 }

 if (params.parentToAppend) {
  params.parentToAppend.appendChild(element);
 }

 if (params.insertTo) {
  params.insertTo.element.insertAdjacentElement(
   params.insertTo.position,
   element
  );
 }

 if (params.attributes) {
  for (const [name, value] of Object.entries(params.attributes)) {
   element.setAttribute(name, value);
  }
 }

 return element;
};
