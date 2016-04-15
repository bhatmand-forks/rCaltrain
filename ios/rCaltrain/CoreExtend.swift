//
//  CoreExtend.swift
//  rCaltrain
//
//  Created by Wanzhang Sheng on 10/26/14.
//  Copyright (c) 2014-2015 Ranmocy. All rights reserved.
//

import Foundation

// Regexp
prefix operator / { }
prefix func /(pattern:String) -> NSRegularExpression {
    return try! NSRegularExpression(pattern: pattern, options: [])
}
infix operator / {}
func / (regexp: NSRegularExpression, optionStr: String) -> NSRegularExpression {
    var options: UInt = 0
    for char in Array(optionStr.characters) {
        switch char {
        case "g":
            options += NSRegularExpressionOptions.AnchorsMatchLines.rawValue
        case "s":
            options += NSRegularExpressionOptions.AllowCommentsAndWhitespace.rawValue
        case "i":
            options += NSRegularExpressionOptions.CaseInsensitive.rawValue
        case "m":
            options += NSRegularExpressionOptions.DotMatchesLineSeparators.rawValue
        case "M":
            options += NSRegularExpressionOptions.IgnoreMetacharacters.rawValue
        case "u":
            options += NSRegularExpressionOptions.UseUnixLineSeparators.rawValue
        case "U":
            options += NSRegularExpressionOptions.UseUnicodeWordBoundaries.rawValue
        default:
            print("Unknown regexp options: \(char)")
        }
    }
    return try! NSRegularExpression(pattern: regexp.pattern, options: NSRegularExpressionOptions(rawValue: options))
}
infix operator =~ { }
func =~ (string: String, regex: NSRegularExpression!) -> Bool {
    let matches = regex.numberOfMatchesInString(string, options: [], range: NSMakeRange(0, string.length))
    return matches > 0
}
func =~ (regex: NSRegularExpression?, str: String) -> Bool {
    return str =~ regex
}

extension String {
    var length: Int {
        get {
            return self.characters.count
        }
    }

    func `repeat`(times: Int) -> String {
        var str = ""
        for _ in 0..<times {
            str += self
        }
        return str
    }

    func rjust(length: Int, withStr: String = " ") -> String {
        return withStr.`repeat`(length - self.length) + self
    }
}


func < (left: NSDate, right: NSDate) -> Bool {
    return left.timeIntervalSinceDate(right) < 0
}
func <= (left: NSDate, right: NSDate) -> Bool {
    return left.timeIntervalSinceDate(right) <= 0
}
func > (left: NSDate, right: NSDate) -> Bool {
    return left.timeIntervalSinceDate(right) > 0
}
func >= (left: NSDate, right: NSDate) -> Bool {
    return left.timeIntervalSinceDate(right) >= 0
}
func == (left: NSDate, right: NSDate) -> Bool {
    return left.timeIntervalSinceDate(right) == 0
}
extension NSDate {
    struct Cache {
        static let currentCalendar = NSCalendar.currentCalendar()
    }
    class var currentCalendar: NSCalendar {
        return Cache.currentCalendar
    }
    class var nowTime: NSDate {
        let calendar = NSDate.currentCalendar
        let components = calendar.components([.Hour, .Minute, .Second], fromDate:  NSDate())
        let seconds = components.hour * 60 * 60 + components.minute * 60 + components.second
        return NSDate(secondsSinceMidnight: seconds)
    }

    convenience init(secondsSinceMidnight seconds: Int) {
        self.init(timeIntervalSince1970: NSTimeInterval(seconds))
    }

    // date format is "yyyymmdd"
    class func parseDate(asYYYYMMDDInt dateInt: Int) -> NSDate {
        let calendar = NSCalendar.currentCalendar()
        let com = NSDateComponents()
        com.year = dateInt / 10000
        com.month = (dateInt / 100) % 100
        com.day = dateInt % 100

        if let date = calendar.dateFromComponents(com) {
            return date
        } else {
            fatalError("Can't parse date: \(dateInt)!")
        }
    }

}

extension NSDateFormatter {
    convenience public init(dateFormat: String!) {
        self.init()
        self.dateFormat = dateFormat
    }

    class func weekDayOf(Date: NSDate) -> Int? {
        return Int(NSDateFormatter(dateFormat: "e").stringFromDate(Date))
    }
}
