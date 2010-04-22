function personalization_form () {
  var $ = jQuery;

  function scroll_strip(panel) {
    if ($(panel).hasClass('images-scroller')) {
      $(panel).scrollLeft(0);
      var position = $('input:checked', panel).parents('td').position();
      if (position)
        $(panel).scrollLeft(position.left);
    }
    return true;
  }

  var product_image_box = $('div.product-img-box').css('position', 'relative')[0];
  var product_image_element = $('p.product-image', product_image_box)[0];
  var has_image_zoomer = $(product_image_element).hasClass('product-image-zoom');

  //If there's previews for the product
  if (previews.length) {

    //and base image is not set
    if (!has_image_zoomer)
      //then remove all original images placed by M.
      $(product_image_element).empty();

    //and it's personalization step (for 2-step theme)
    if (is_personalization_step) {
      //remove zoomer and base image
      $(product_image_element).removeClass('product-image-zoom');
      $('#image, #track_hint, div.zoom').remove();
      has_image_zoomer = false;
    }
  }

  //Add previews to the product page
  for (var page_number = 0; page_number <  previews.length; page_number++)
    $('<a id="preview-image-page-' + (page_number + 1) +
      '" class="zetaprints-template-preview  hidden" href="' + w2p_url + previews[page_number] +
      '"><img title="' + click_to_view_in_large_size + '" src="' + w2p_url +
      previews[page_number] + '" /></a>').appendTo(product_image_element);

  //Reset previews array if previews was default template preview images
  if (!previews_from_session)
    previews = [];

  $('div.zetaprints-page-stock-images input:checked').each(function() {
    $(this).parents('div.zetaprints-images-selector').removeClass('no-value');
  });

  //If no image zoomer on the page
  if (!has_image_zoomer)
    //then show preview for the first page
    $('#preview-image-page-1').removeClass('hidden');

  $('#stock-images-page-1, #input-fields-page-1').removeClass('hidden');
  $('div.zetaprints-image-tabs, div.zetaprints-preview-button').css('display', 'block');

  $('div.zetaprints-image-tabs li:first').addClass('selected');

  $('div.tab.user-images').each(function() {
    var tab_button = $('ul.tab-buttons li.hidden', $(this).parents('div.selector-content'));

    if ($('td', this).length > 0)
      $(tab_button).removeClass('hidden');
  });

  number_of_pages = $('a.zetaprints-template-preview').length;
  current_page = 0;
  changed_pages = new Array(number_of_pages);

  if (previews_from_session) {
    $('a.zetaprints-image-tabs img').each(function () {
      var src = $(this).attr('src').split('thumb');
      var id = src[1].split('_');
      var n = id[0].substring(38, id[0].length);

      var new_id = previews[n].split('.');
      $(this).attr('src', src[0] + 'thumb/' + new_id[0] + '_100x100.' + new_id[1]);
    });

    $('<input type="hidden" name="zetaprints-previews" value="' + previews.join(',') + '" />').appendTo($('#product_addtocart_form div.no-display'));
  } else {
    $('<input type="hidden" name="zetaprints-previews" value="" />').appendTo($('#product_addtocart_form div.no-display'));
    $('div.add-to-cart button.button').css('display', 'none');
  }

  $('<input type="hidden" name="zetaprints-TemplateID" value="' + template_id +'" />').appendTo('#product_addtocart_form');

  $('div.zetaprints-image-tabs li').click(function () {
    $('div.zetaprints-image-tabs li').removeClass('selected');

    //Hide preview image, text fields and image fields for the current page
    $('a.zetaprints-template-preview, div.zetaprints-page-stock-images, div.zetaprints-page-input-fields').addClass('hidden');

    //Remove shapes for current page
    if (shapes.length && window.remove_all_shapes)
      remove_all_shapes(product_image_box);

    $(this).addClass('selected');
    var page = $('img', this).attr('rel');

    //If there's image zoomer on the page
    if (has_image_zoomer) {
      //remove it and base image
      $(product_image_element).removeClass('product-image-zoom');
      $('#image, #track_hint, div.zoom').remove();
      has_image_zoomer = false;
    }

    //Show preview image, text fields and image fields for the selected page
    $('#preview-image-' + page + ', #stock-images-' + page + ', #input-fields-'
      + page).removeClass('hidden');

    //Remember number of selected page
    current_page = page.split('-')[1] * 1 - 1;

    //Add shapes for selected page
    if (shapes.length && window.place_all_precalculated_shapes_for_page)
      place_all_precalculated_shapes_for_page(current_page, shapes, product_image_box);

    if (changed_pages[current_page] && page_number < (number_of_pages - 1))
      $('div.zetaprints-next-page-button').show();
    else
      $('div.zetaprints-next-page-button').hide();
  });

  function update_preview () {
    $('div.zetaprints-preview-button span.text').css('display', 'inline');
    $('img.ajax-loader').css('display', 'inline');

    var update_preview_button = $('button.update-preview').unbind('click').hide();
    var page_number = current_page + 1;

    $.ajax({
      url: preview_controller_url,
      type: 'POST',
      data: $('#product_addtocart_form').serialize() + '&zetaprints-From=' + page_number,
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        $('div.zetaprints-preview-button span.text, img.ajax-loader').css('display', 'none');
        $(update_preview_button).bind('click', update_preview).show();
        alert(preview_generation_response_error_text + textStatus); },
      success: function (data, textStatus) {
        if (data.substr(0, 7) != 'http://') {
          alert(preview_generation_error_text);
        } else {
          $('#preview-image-page-' + page_number).attr('href', data);
          $('#preview-image-page-' + page_number + ' img').attr('src', data);

          var image_name = data.split('/preview/')[1]
          previews[current_page] = image_name;

          var thumb_url = data.split('/preview/')[0] + '/thumb/' + image_name.split('.')[0] + '_100x100.' + image_name.split('.')[1];
          $('div.zetaprints-image-tabs img[rel=page-' + page_number + ']').attr('src', thumb_url);

          //If there's image zoomer on the page
          if (has_image_zoomer) {
            //remove it and base image
            $(product_image_element).removeClass('product-image-zoom');
            $('#image, #track_hint, div.zoom').remove();
            has_image_zoomer = false;
            //and show preview image for the current page
            $('#preview-image-page-' + page_number).removeClass('hidden');
          }

          if (previews.length == number_of_pages) {
            $('input[name=zetaprints-previews]').val(previews.join(','));
            $('div.add-to-cart button.button').show();
            $('div.save-order span').css('display', 'none');
          }
        }

        changed_pages[current_page] = true;

        if (page_number < number_of_pages)
          $('div.zetaprints-next-page-button').show();
        else
          $('div.zetaprints-next-page-button').hide();

        $('div.zetaprints-preview-button span.text, img.ajax-loader').css('display', 'none');
        $(update_preview_button).bind('click', update_preview).show(); }
    });

    return false;
  }

  $('button.update-preview').click(update_preview);

  $('div.button.choose-file').each(function () {
    var uploader = new AjaxUpload(this, {
      name: 'customer-image',
      action: upload_controller_url,
      autoSubmit: false,
      onChange: function (file, extension) {
        var upload_div = $(this._button).parents('div.upload');
        $('input.file-name', upload_div).val(file);
        $('div.button.upload-file', upload_div).removeClass('disabled');
      },
      onSubmit: function (file, extension) {
        var upload_div = $(this._button).parents('div.upload');
        $('div.button.upload-file', upload_div).addClass('disabled');
        $('img.ajax-loader', upload_div).show();
      },
      onComplete: function (file, response) {
        var upload_div = $(this._button).parents('div.upload');

        if (response == 'Error') {
          $('img.ajax-loader', upload_div).hide();
          alert(uploading_image_error_text);
          return;
        }

        var upload_field_id = $(upload_div).parents('div.selector-content').attr('id');

        $('input.file-name', upload_div).val('');

        response = response.split(';');

        var trs = $('div.zetaprints-page-stock-images div.tab.user-images table tr');

        $(this._button).parents('div.zetaprints-images-selector.no-value')
          .removeClass('no-value');

        var number_of_loaded_imgs = 0;

        $(trs).each(function () {
          var name = $('input[name=parameter]', $(this).parents('div.user-images')).val();

          var td = $('<td><input type="radio" name="zetaprints-#' + name
            + '" value="' + response[0]
            + '" /><a class="edit-dialog" href="' + response[1]
            + 'target="_blank"><img src="' + response[2]
            + '" /></a> <div style="float:right;"><a class="edit-dialog" style="float:left" href="'+response[1]
            + '" target="_blank"><div class="edit-button">' + edit_button_text + '</div></a><a class="delete-button" href="javascript:void(1)"><div class="delete-button"></div></a></div>').prependTo(this);

          var tr = this;

          $('img', td).load(function() {

            //If a field the image was uploaded into is not current image field
            if ($(this).parents('div.selector-content').attr('id') != upload_field_id) {
              var scroll = $(td).parents('div.images-scroller');

              //Scroll stripper to save position of visible images
              $(scroll).scrollLeft($(scroll).scrollLeft() + $(td).outerWidth());
            }

            $('a.edit-dialog', tr).fancybox({
              'padding': 0,
              'titleShow': false,
              'type': 'iframe',
              'hideOnOverlayClick': false,
              'hideOnContentClick': false,
              'centerOnScroll': false });

            $('a.delete-button', td).click(function() {
              var imageId = $(this).parent().prevAll('input').val();

              if (confirm(delete_this_image_text)) {
                $.ajax({
                  url: image_controller_url,
                  type: 'POST',
                  data: 'zetaprints-action=img-delete&zetaprints-ImageID='+imageId,
                  error: function (XMLHttpRequest, textStatus, errorThrown) {
                    alert(cant_delete_text + ': ' + textStatus);
                  },
                  success: function (data, textStatus) {
                    $('input[value='+imageId+']').parent().remove();
                  }
                });
              }
            });

            if (++number_of_loaded_imgs == trs.length) {
              $('div.tab.user-images input[value=' + response[0] + ']',
                $(upload_div).parent()).attr('checked', 1);

              $('img.ajax-loader', upload_div).hide();
              $('div.zetaprints-page-stock-images ul.tab-buttons li.hidden')
                .removeClass('hidden');
              $(upload_div).parents('div.selector-content').tabs('select', 1);
            }
          });
        });
      }
    });

    $('div.button.upload-file', $(this).parent()).click(function () {
      if (!$(this).hasClass('disabled'))
        uploader.submit();
    });
  })

  $(window).load(function () {
    if (shapes.length && window.precalculate_shapes && window.place_all_precalculated_shapes_for_page) {
      precalculate_shapes(shapes, get_preview_dimensions(number_of_pages));
      place_all_precalculated_shapes_for_page(current_page, shapes, product_image_box);
    }

    $('div.zetaprints-images-selector').each(function () {
      var top_element = this;

      var tab_number = 0
      if ($('li.hidden', this).length == 0)
        tab_number = 1;

      var tabs = $('div.selector-content', this).tabs({
        selected: tab_number,
        show: function (event, ui) {
          if ($(ui.panel).hasClass('color-picker') && !$('input', ui.panel).attr('checked'))
            $('div.color-sample', ui.panel).click();
            scroll_strip(ui.panel);
              }
      });

      $('input', this).change(function () {
        $(top_element).removeClass('no-value');
      });

      $('div.head', this).click(function () {
        if ($(top_element).hasClass('minimized')) {
          $(top_element).removeClass('minimized');
          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));
          if (panel.hasClass('color-picker') && !$('input', panel).attr('checked')) {
            $('div.color-sample', panel).click();
          }
          scroll_strip(panel)
        }
        else
          $(top_element).addClass('minimized').removeClass('expanded').css('width', '100%');

        return false;
      });

      var previews_images = $('div.product-img-box');

      $('a.image.collapse-expand', this).click(function () {
        if ($(top_element).hasClass('expanded')) {
          $(top_element).removeClass('expanded').css('width', '100%');
          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));
        } else {
          var position = $(top_element).position().left - $(previews_images).position().left;
          $(top_element).addClass('expanded')
            .css({ 'left': -position, 'width': position + $(top_element).outerWidth() })
            .removeClass('minimized');

          var panel = $($('a', $('ul.tab-buttons li', top_element)[tabs.tabs('option', 'selected')]).attr('href'));
          if (panel.hasClass('color-picker') && !$('input', panel).attr('checked')) {
            $('div.color-sample', panel).click();
          }
        }
        scroll_strip(panel);
        return false;
      });

      var input = $('div.color-picker input', this)[0];
      var color_sample = $('div.color-sample', this);

      var colour = $(input).val();
      if (colour)
        $(color_sample).css('backgroundColor', colour);

      $([color_sample, $('div.color-picker a', this)]).ColorPicker({
        color: '#804080',
        onBeforeShow: function (colpkr) {
          var colour = $(input).val();
          if (colour)
            $(this).ColorPickerSetColor(colour);

          $(colpkr).draggable();
          return false;
        },
        onShow: function (colpkr) {
          $(colpkr).fadeIn(500);
          return false;
        },
        onHide: function (colpkr) {
          $(colpkr).fadeOut(500);
          return false;
        },
        onSubmit: function (hsb, hex, rgb, el) {
          $(top_element).removeClass('no-value');
          $(color_sample).css('backgroundColor', '#' + hex);
          $(input).val('#' + hex).attr('checked', 1).attr('disabled', 0);
          $(el).ColorPickerHide();
        }
      });
    });
  });

  $('div.zetaprints-next-page-button').click(function () {
    var next_page_number = current_page + 2;

    $('div.zetaprints-image-tabs li img[rel=page-' + next_page_number +']').parent().click();

    if (next_page_number >= number_of_pages)
      $(this).hide();

    return false;
  });

  $('a.zetaprints-template-preview').fancybox({
    'zoomOpacity': true,
    'overlayShow': false,
    'centerOnScroll': false,
    'zoomSpeedChange': 200,
    'zoomSpeedIn': 500,
    'zoomSpeedOut' : 500,
    'titleShow': false,
    'onComplete': function () {
      $('img#fancy_img').attr('title', click_to_close_text);

      if (!(shapes.length && window.place_all_shapes_for_page
        && window.highlight_shape_by_name && window.popup_field_by_name))
        return;

      var fancy_inner = $('div#fancybox-inner')[0];
      var fancy_image = $('img#fancybox-img', fancy_inner)[0];

      var dimension = {
        width: $(fancy_image).width(),
        height: $(fancy_image).height() };

      place_all_shapes_for_page (current_page, shapes, dimension, fancy_inner);

      if (typeof(current_field_name) != 'undefined' && current_field_name != null && current_field_name.length != 0) {
        highlight_shape_by_name(current_field_name, fancy_inner);
        popup_field_by_name(current_field_name);
      }

      current_field_name = null;
    },
    'onCleanup': function () {
      if (shapes.length && window.popdown_field_by_name) {
        $('div.zetaprints-field-shape', $('div#fancybox-inner')).removeClass('highlighted');
        popdown_field_by_name();
      }
    } });

  $('a.in-dialog').fancybox({
    'zoomOpacity': true,
    'overlayShow': false,
    'centerOnScroll': false,
    'zoomSpeedChange': 200,
    'zoomSpeedIn': 500,
    'zoomSpeedOut' : 500,
    'titleShow': false,
    'callbackOnShow': function () { $('img#fancy_img').attr('title', click_to_close_text); } });

  $('a.edit-dialog').fancybox({
    'padding': 0,
    'titleShow': false,
    'type': 'iframe',
    'hideOnOverlayClick': false,
    'hideOnContentClick': false,
    'centerOnScroll': false });

  $('div.zetaprints-page-input-fields input[title], div.zetaprints-page-input-fields textarea[title]').qtip({
    position: { corner: { target: 'bottomLeft' } },
        show: { delay: 1, solo: true, when: { event: 'focus' } },
        hide: { when: { event: 'unfocus' } }
  });

  $('div.zetaprints-page-stock-images select[title]').qtip({
    position: { corner: { target: 'topLeft' }, adjust: { y: -30 } },
        show: { delay: 1, solo: true, when: { event: 'focus' } },
        hide: { when: { event: 'unfocus' } }
  });

  $('div.zetaprints-page-input-fields input.input-text').keypress(function (event) {
    if (event.keyCode == 13)
      return false;
  });

  $('a.delete-button').click(function() {
    var imageId = $(this).parent().prevAll('input').val();

    if (confirm(delete_this_image_text)) {
      $.ajax({
        url: image_controller_url,
        type: 'POST',
        data: 'zetaprints-action=img-delete&zetaprints-ImageID='+imageId,
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          alert(cant_delete_text + ': ' + textStatus);
        },
        success: function (data, textStatus) {
          $('input[value='+imageId+']').parent().remove();
        }
      });
    }
  });

  if (shapes.length && window.add_in_preview_edit_handlers)
    add_in_preview_edit_handlers();
}