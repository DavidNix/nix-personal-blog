+++
date = "2016-06-08T09:00:00-06:00"
title = "How to Ditch Storyboards and Nibs Forever"
tags = ["ios", "ui"]
description = "It's an ongoing debate between iOS devs. Do I layout my UI with storyboards and nibs or not? I finally found one solution that let me ditch them forever."
+++

It's an ongoing debate between iOS devs. Do I layout my UI with storyboards and
nibs or not? I finally found one solution that let me ditch 
them forever.

Storyboard problems are well documented. They don't work with version control. They
can get so bloated that debugging them is nearly impossible. The files can get so
huge, you see the beach ball of death every time you open one. Keeping
IBOutlets, IBActions, and cell identifiers in sync with your source files is
tricky, often leading to runtime exceptions if you rename the outlets in your
source code.

Up until recently, I chose from three options for view layout:

1. Old school frame manipulation with `UIViewAutoResizing` mask
2. Create `NSLayoutConstraint`s in code
3. Use Storyboards and Nibs

I always chose option 3. I didn't want to go back to frame arithmetic and
calling `sizeThatFits:` everywhere. 

I've always wanted to be one of those "purests" and write all of my UI in code. But
let's face it, Apple's Auto Layout API is verbose and confusing. One method to
do everything.

```objectivec
+ (instancetype)constraintWithItem:(id)view1
                         attribute:(NSLayoutAttribute)attr1
                         relatedBy:(NSLayoutRelation)relation
                            toItem:(id)view2
                         attribute:(NSLayoutAttribute)attr2
                        multiplier:(CGFloat)multiplier
                          constant:(CGFloat)c
```

That's seven method arguments. Seven!

Or you can use Apple's Visual Format language. Stringly typed code anyone? No
thank you.

Allow me to introduce you to [SnapKit](https://github.com/SnapKit/SnapKit). A
game changer for me. Ever since I started using SnapKit, I have yet to create a
new storyboard or nib.

**Disclaimer:** I have nothing to do with SnapKit's development. I'm just a
huge fan.

For a third-party DSL, SnapKit gets everything right. They follow the UNIX
philosophy. They do one thing and do it well - make Auto Layout declarative and
concise. 

Here's a summary of benefits taken directly from their
[website](http://snapkit.io/docs/):  

* Not limited to a subset of Auto Layout. Anything NSLayoutConstraint can do
  SnapKit can also do.
* Better debugging support to help find breaking constraints.
* No crazy operator overloads.
* Not string or dictionary based and you get the strictest compile time checks
  possible.

Other benefits I've found:

* Automatically disables `translatesAutoresizingMaskIntoConstraints`
  for you
* Handles bookkeeping so you can easily update constraints
* One of the best uses of method overloading I've seen

## An Example

Let's keep it simple. I want a view that has margins to its superview.

Here's how you can do it in SnapKit:

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.snp_makeConstraints { make in
    make.edges.equalTo(EdgeInsets(top: 10, left: 10, bottom: -10, right: -10))
}
```

As you can see, SnapKit uses the [Builder
Pattern](https://en.wikipedia.org/wiki/Builder_pattern) with a clever use of
closures to achieve a concise and readable DSL.

Versus how you would do it with standard UIKit:

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.translatesAutoresizingMaskIntoConstraints = false

let top = NSLayoutConstraint(
    item: view,
    attribute: .Top,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Top,
    multiplier: 1,
    constant: 10
)

let left = NSLayoutConstraint(
    item: view,
    attribute: .Left,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Left,
    multiplier: 1,
    constant: 10
)

let bottom = NSLayoutConstraint(
    item: view,
    attribute: .Bottom,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Bottom,
    multiplier: 1,
    constant: -10
)

let right = NSLayoutConstraint(
    item: view,
    attribute: .Right,
    relatedBy: .Equal,
    toItem: parent,
    attribute: .Right,
    multiplier: 1,
    constant: -10
)

parent.addConstraints([top, left, bottom, right])
```

*Painful.* Ok, now let's see Visual Format.

```swift
let parent = UIView()
let view = UIView()
parent.addSubview(view)

view.translatesAutoresizingMaskIntoConstraints = false

let vertical = NSLayoutConstraint.constraintsWithVisualFormat("V:|-10-[view]-10-|", options: [], metrics: nil, views: ["view": view])
let horizontal = NSLayoutConstraint.constraintsWithVisualFormat("H:|-10-[view]-10-|", options: [], metrics: nil, views: ["view": view])

parent.addConstraints(vertical + horizontal)
```

Visual Format is less verbose than raw `NSLayoutConstraint`s. However, I caused
two runtime exceptions because of typos in the visual format string. 

## Caveats

* Snapkit is Swift only. But the authors still maintain their original
  Objective C library, [Masonry](https://github.com/SnapKit/Masonry).
* With watchOS, you have to use Storyboards. Shucks.
* I personally haven't dived into `UIStackView` because I'm still supporting
  iOS 8. `UIStackView` may alleviate some Auto Layout pain.

## What about other Auto Layout DSLs?

I haven't tried other popular libraries like
[Cartography](https://github.com/robb/Cartography) and
[PureLayout](https://github.com/PureLayout/PureLayout). When I stumbled upon
SnapKit, I instantly loved their API and stuck with it.
