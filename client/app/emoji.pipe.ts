import { Pipe, PipeTransform } from '@angular/core';
const emojify = require('emojify.js/dist/js/emojify.js');

@Pipe({
  name: 'emojiPipe'
})
export class EmojiPipe implements PipeTransform {
  transform(value: string): any {
    return emojify.replace(value);
  }
}