/**
 * Code tabs generation.
 * This code that use jquery will create tabs for code snip.
 */
jQuery(() => {
    // for each tabs
    jQuery('div.code-sample').each((i, elemRaw) => {
        const li = [];
        const elem = jQuery(elemRaw);

        // find all contents to build ids:
        elem.find('.tab-content').each((k, subElemRaw) => {
            const subElem = jQuery(subElemRaw);
            const currentId = 'sub-' + subElem.attr('data-name').replace(/[^\w ]/g, '');
            li.push({
                tab: currentId,
                label: subElem.attr('data-name')
            });
            subElem.attr('id', currentId);
        });

        // generate tabs:
        let stringTabs = '';
        for(let j = 0; j < li.length; j++) {
            var liElem  = li[j]
            stringTabs += '<li><a data-tab="' + liElem.tab + '">' + liElem.label + '</a></li>';
        }
        elem.prepend('<ul class="tab">' + stringTabs + '</ul>');

        // tab logic:
        elem.find('li a').click((event) => {
            const link = jQuery(event.target);
            const target = link.attr('data-tab');
            link.parents('ul.tab').find('.active').removeClass('active');
            link.parent().addClass('active');
            link.parents('.code-sample').find('.tab-content').each((j, tabRaw) => {
                const tab = jQuery(tabRaw);
                if(tab.attr('id') === target) {
                    tab.show();
                }
                else {
                    tab.hide();
                }
            })
        })

        // click the first tab:
        elem.find('li a').first().trigger('click');

    });
})