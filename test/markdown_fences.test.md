<!-- SYNTAX TEST "text.html.markdown" "HAML code blocks in Markdown"
```haml
<!--<--- markup.fenced_code.block.markdown punctuation.definition.markdown - meta.embedded.block.haml
<!--<~~~---- markup.fenced_code.block.markdown fenced_code.block.language.markdown
%p.note= greeting
<!--<- markup.fenced_code.block.markdown meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
<!--<~- meta.embedded.block.haml meta.tag.haml entity.name.tag.haml
<!--     ^^^^^^^^ meta.embedded.block.haml meta.tag.haml meta.embedded.line.ruby
Hello #{name}
<!--  ^^ meta.embedded.block.haml meta.text.haml meta.interpolation.haml punctuation.section.embedded.begin.haml
```
<!--<--- markup.fenced_code.block.markdown punctuation.definition.markdown - meta.embedded.block.haml
After the block.
<!--<----- meta.paragraph.markdown - markup.fenced_code.block.markdown meta.embedded.block.haml

```HAML title="x"
<!--<~~~---- fenced_code.block.language.markdown
<!--   ^^^^^^^^^^ fenced_code.block.language.attributes.markdown
%p
<!--<- meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
```

~~~haml
<!--<--- markup.fenced_code.block.markdown punctuation.definition.markdown
-# silent
<!--<-- meta.embedded.block.haml comment.block.silent.haml
~~~
<!--<--- punctuation.definition.markdown - meta.embedded.block.haml comment.block.silent.haml

```haml
%p{class: "unclosed
<!--      ^^^^^^^^^ meta.embedded.block.haml string.quoted.double.interpolated.ruby
```
<!--<--- punctuation.definition.markdown - meta.embedded.block.haml string.quoted.double.interpolated.ruby
Back to Markdown.
<!--<---- meta.paragraph.markdown - meta.embedded.block.haml meta.tag.haml

```ruby
puts "x"
<!--<---- meta.embedded.block.ruby - meta.embedded.block.haml
```

````
```haml
<!--<~~~---- markup.fenced_code.block.markdown - fenced_code.block.language.markdown
%p not HAML inside a fence of another language
<!--<-- markup.fenced_code.block.markdown - meta.embedded.block.haml meta.tag.haml
```
````

Para

    code
    ```haml
<!--^^^^^^^ markup.raw.block.markdown - markup.fenced_code.block.markdown
    %p not HAML inside an indented code block
<!--^^ markup.raw.block.markdown - meta.embedded.block.haml meta.tag.haml
    ```

````markdown
```haml
%p nested
<!--<- meta.embedded.block.markdown meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
```
````

- item

  ```haml
<!--<~~--- markup.list.unnumbered.markdown markup.fenced_code.block.markdown punctuation.definition.markdown
  %li in a list
<!--<~~- markup.list.unnumbered.markdown meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
<!--<~~~-- meta.embedded.block.haml meta.tag.haml entity.name.tag.haml
<!--  ^^^^^^^^^ meta.embedded.block.haml meta.tag.haml meta.text.haml
  %div
    -# a comment
      still the comment
<!--  ^^^^^^^^^^^^^^^^^ meta.embedded.block.haml comment.block.silent.haml
    :javascript
<!--^^^^^^^^^^^ meta.embedded.block.haml entity.name.function.filter.haml
      a();
<!--  ^ meta.embedded.block.haml meta.embedded.block.javascript entity.name.function.js
  %p after the filter
<!--<~~- meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml - meta.embedded.block.javascript
  ```
<!--<~~--- markup.list.unnumbered.markdown punctuation.definition.markdown - meta.embedded.block.haml

> ```haml
<!--<~~--- markup.quote.markdown punctuation.definition.markdown
> %p in a quote
<!--<~~- markup.quote.markdown meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
<!--<~~~- meta.embedded.block.haml meta.tag.haml entity.name.tag.haml
<!-- ^^^^^^^^^^ meta.embedded.block.haml meta.tag.haml meta.text.haml
> = foo
<!--<~~- meta.embedded.block.haml meta.line.script.haml punctuation.section.embedded.begin.haml
<!--^^^ meta.embedded.block.haml meta.embedded.line.ruby
> :javascript
>   a();
<!--^ meta.embedded.block.haml meta.embedded.block.javascript entity.name.function.js
> %p after the filter
<!--<~~- meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml - meta.embedded.block.javascript
> ```
<!--<~~--- markup.quote.markdown punctuation.definition.markdown - meta.embedded.block.haml

>```haml
>%p without a space after the marker
<!--<~- markup.quote.markdown meta.embedded.block.haml meta.tag.haml punctuation.definition.tag.haml
>```
