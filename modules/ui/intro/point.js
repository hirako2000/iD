import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilBindOnce } from '../../util/bind_once';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroPoint(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        corner = [-85.632481, 41.944094];


    var chapter = {
        title: 'intro.points.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function addPoint() {
        var tooltip = reveal('button.add-point',
            t('intro.points.add', { button: icon('#icon-point', 'pre-text') }));

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#poi-images');

        context.on('enter.intro', placePoint);
    }


    function placePoint(mode) {
        if (mode.id !== 'add-point') return;
        context.on('enter.intro', enterSelect);

        var pointBox = pad(corner, 150, context);
        reveal(pointBox, t('intro.points.place'));

        context.map().on('move.intro drawn.intro', function() {
            pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.place'), {duration: 0});
        });
    }


    function enterSelect(mode) {
        if (mode.id !== 'select') return;
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);

        timeout(function() {
            reveal('.preset-search-input',
                t('intro.points.search', {name: context.presets().item('amenity/cafe').name()}));
            d3.select('.preset-search-input').on('keyup.intro', keySearch);
        }, 500);
    }


    function keySearch() {
        var first = d3.select('.preset-list-item:first-child');
        if (first.classed('preset-amenity-cafe')) {
            reveal(first.select('.preset-list-button').node(), t('intro.points.choose'));
            utilBindOnce(context.history(), 'change.intro', selectedPreset);
            d3.select('.preset-search-input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);
        }
    }


    function selectedPreset() {
        timeout(function() {
            reveal('.entity-editor-pane', t('intro.points.describe'), {tooltipClass: 'intro-points-describe'});
            context.history().on('change.intro', closeEditor);
            context.on('exit.intro', selectPoint);
        }, 400);
    }


    function closeEditor() {
        d3.select('.preset-search-input').on('keydown.intro', null);
        context.history().on('change.intro', null);
        reveal('.entity-editor-pane',
            t('intro.points.close', { button: icon('#icon-apply', 'pre-text') }));
    }


    function selectPoint() {
        context.on('exit.intro', null);
        context.history().on('change.intro', null);
        context.on('enter.intro', enterReselect);

        var pointBox = pad(corner, 150, context);
        reveal(pointBox, t('intro.points.reselect'));

        context.map().on('move.intro drawn.intro', function() {
            pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.reselect'), {duration: 0});
        });
    }


    function enterReselect(mode) {
        if (mode.id !== 'select') return;
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.points.fixname', { button: icon('#icon-apply', 'pre-text') }));
            context.on('exit.intro', deletePoint);
        }, 500);
    }


    function deletePoint() {
        context.on('exit.intro', null);
        context.on('enter.intro', enterDelete);

        var pointBox = pad(corner, 150, context);
        reveal(pointBox, t('intro.points.rightclick'));

        context.map().on('move.intro drawn.intro', function() {
            pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.rightclick'), {duration: 0});
        });
    }


    function enterDelete(mode) {
        if (mode.id !== 'select') return;
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);
        context.on('exit.intro', deletePoint);
        context.map().on('move.intro drawn.intro', deletePoint);
        context.history().on('change.intro', deleted);

        timeout(function() {
            // deprecation warning - Radial Menu to be removed in iD v3
            var node = d3.select('.edit-menu-item-delete, .radial-menu-item-delete').node();
            if (!node) {
                deletePoint();
            } else {
                var pointBox = pad(node.getBoundingClientRect(), 50, context);
                reveal(pointBox,
                    t('intro.points.delete', { button: icon('#operation-delete', 'pre-text') }));
            }
        }, 300);
    }


    function deleted(changed) {
        if (changed.deleted().length) {
            dispatch.call('done');
        }
    }


    chapter.enter = function() {
        context.history().reset('initial');
        context.map().zoom(19).centerEase([-85.63279, 41.94394]);
        addPoint();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('exit.intro', null);
        context.on('enter.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-search-input')
            .on('keyup.intro', null)
            .on('keydown.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
