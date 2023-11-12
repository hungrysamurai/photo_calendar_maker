/**
 * @property {Function} createSVGelement - create DOM HTML Elements with given params
 */
export const createSVGElement = <TagName extends keyof SVGElementTagNameMap>(
  params: CreateSVGElementParams<TagName>
): SVGElementTagNameMap[TagName] => {
  const element = document.createElementNS<TagName>(
    "http://www.w3.org/2000/svg",
    params.elementName
  );

  if (params.id) {
    element.id = params.id;
  }

  if (params.content) {
    element.innerHTML = params.content;
  }

  if (params.parentToAppend) {
    params.parentToAppend.appendChild(element);
  }

  if (params.children) {
    params.children.forEach((c) => element.appendChild(c));
  }

  if (params.attributes) {
    for (const [name, value] of Object.entries(params.attributes)) {
      element.setAttribute(name, value);
    }
  }

  if (params.attributesNS) {
    for (const [name, value] of Object.entries(params.attributesNS)) {
      element.setAttributeNS("http://www.w3.org/1999/xlink", name, value);
    }
  }

  return element;
};
