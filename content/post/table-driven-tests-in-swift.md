+++
date = "2016-01-11T00:00:00-00:00"
title = "Table Driven Tests in Swift"
tags = ["ios", "tutorial"]
description = "Table driven tests give you more test coverage for less lines of code. Let's explore how to write them in Swift"
+++

Table driven tests are nothing new. I was introduced to them when I started
learning unit testing in Go.  Dave Cheney has a [good
article](http://dave.cheney.net/2013/06/09/writing-table-driven-tests-in-go)
about how to write them in Go.

## Why use table driven tests?

I can't say it better myself so I'll quote Dave Cheney:

> They allow you to write unit tests in a concise fashion, hopefully leading to
> greater test coverage at a lower line count. If done correctly, adding
> additional test cases is as simple as a new element in the test table.

Sounds like a good deal to me.

## Ok, so what are table driven tests?

Go allows us to declare anonymous structs, which are locally defined, typed
data structures.

In other words, we define a struct and assign it to a local variable all in the
same scope. We then place an arbitrary number of said structs into an array.

Our goal is to iterate over a list of examples and make an assertion using each
element in the array.

Each array element is like a table row and the fields in the struct are like
table columns.  Hence the name, table driven tests.

Swift 2.1 does not allow us to declare anonymous structs or classes.  Instead,
we must define them beforehand. 

But not to worry, Swift does allow us to define *other* anonymous, typed data
structures. [Named
tuples](https://developer.apple.com/library/ios/documentation/Swift/Conceptual/Swift_Programming_Language/TheBasics.html#//apple_ref/doc/uid/TP40014097-CH5-ID329)
can serve the same purpose as anonymous structs in Go.

```swift
let tests: [(input: SomeType, expected: SomeType)] = [...]

// alternatively
let tests: Array<(input: SomeType, expected: SomeType)> = [...]
```

Note: By convention, most authors put the expected value as the last field in
the tuple. I recommend sticking to that convention.

An example will best illustrate how to use an inline array of tuples.

## Example Table Driven Test

```swift
// A silly function to test
public func concat(arg1: String, arg2: String) -> String {
    return arg1 + " " + arg2
}

// Test Case

import XCTest

class ConcatTest: XCTestCase {
    
   func test_concat() {
        
        // Define the "table"
        let tests: [(arg1: String, arg2: String, expected: String)] = [
            ("cat", "hat", "cat hat"),
            ("red", "yellow", "red yellow"),
            ("", "", " "),
            // etc ...
        ]
        
        // Assert once per table row
        for test in tests {
            let actual = concat(test.arg1, arg2: test.arg2)
            
            XCTAssertEqual(actual, test.expected)
        }
    } 
}
```

**An important note:** If your failure output is unclear, write a custom
failure statement. That way, you can quickly spot the example that caused the
failure.

**Don't settle for this:**

```swift
XCTAssertNotNil(someVar)
// Prints "XCTAssertNotNil failed"
```

**Do this instead:**

```wift
// Given test.expected = "Foo"
XCTAssert(someVar != nil, "expected \(test.expected), got nil")
// Prints "XCTAssertTrue failed - expected Foo, got nil"
```

# Conclusion

Table driven tests aren't suitable for everything. But they can be a useful
tool for unit testing certain types of functions or methods. They give you more
test coverage for less lines of code. Pure functions that take N inputs and
return an output are prime candidates for table driven tests. I encourange you
to make them a part of your unit testing arsenal.
