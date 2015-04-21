//
//  ResultTableViewCell.swift
//  rCaltrain
//
//  Created by Wanzhang Sheng on 10/23/14.
//  Copyright (c) 2014 Ranmocy. All rights reserved.
//

import UIKit

class ResultTableViewCell: UITableViewCell {

    @IBOutlet var departureLabel: UILabel!
    @IBOutlet var arrivalLabel: UILabel!
    @IBOutlet var durationLabel: UILabel!

    func updateData(result: Result) {
        departureLabel.text = result.departureStr
        arrivalLabel.text = result.arrivalStr
        durationLabel.text = "\(result.durationInMin)min"
    }

}
