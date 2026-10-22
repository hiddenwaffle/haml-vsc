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
<!--<~~--- markup.list.unnumbered.markdown meta.embedded.block.haml
  ```
<!--<~~--- markup.list.unnumbered.markdown punctuation.definition.markdown - meta.embedded.block.haml
